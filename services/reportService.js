const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const Head = require('../models/Head');
const { getSubscriptionDetails } = require("../helpers/subscriptionHelper");
const { convertDecimal128 } = require("../utils/convertDecimal");
const Ledger = require("../models/Ledger");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const User = require('../models/User');
const FinancialYear = require('../models/FinancialYear');
const { PDFDocument } = require('pdf-lib');

exports.generateReport = async (user, reportType, headId) => {
  try {
    // Initialize the data object
    const reportData = {
      cssPath: path.resolve(__dirname, '../public/css', 'style.css')
    };

    const { user_id, financial_year_id } = await getSubscriptionDetails(user);
    const userDetails = await User.findById(user_id).select('school_name school_dice_code rojmel_name cluster_name bank_name bank_account_no sub_division district');
    reportData.userDetails = userDetails;

    if (financial_year_id) {
      const financialYear = await FinancialYear.findById(financial_year_id).select('fy_start_date fy_end_date');
      if (financialYear) {
        const startYear = new Date(financialYear.fy_start_date).getFullYear();
        const endYear = new Date(financialYear.fy_end_date).getFullYear().toString().slice(-2);
        financialYear.financial_tag = `${startYear}-${endYear}`;
      }
      reportData.financialYear = financialYear;
    }

    // If reportType is 'khatavahi', fetch the head details
    if (reportType === 'khatavahi' && headId) {
      try {
        const head = await Head.findById({ _id: new ObjectId(headId) }).select('head_name opening_balance_cash opening_balance_bank');
        if (!head) throw { status: 404, message: 'વિનંતી કરાયેલ હેડ મળ્યું નથી' };
        reportData.head = head;
      } catch (error) {
        console.error('Error fetching head details:', error);
        throw { status: 500, message: 'વિગત મેળવવામાં અસમર્થ છીએ' };
      }
    } else if (reportType === 'khatavahi' && !headId) {
      throw { status: 400, message: 'હેડ અને રિપોર્ટનો પ્રકાર આવશ્યક છે' };
    }

    // Determine the template path based on the report type
    let templatePath;
    let creditTemplatePath;
    let depositTemplatePath;
    switch (reportType) {
      case 'cashbook':
        const cashBookResult = await generateCashbookReport(user_id, financial_year_id);
        reportData.cashbookResultData = cashBookResult;
        creditTemplatePath = path.resolve(__dirname, '../views', 'cashbookCredit.ejs');
        depositTemplatePath = path.resolve(__dirname, '../views', 'cashbookDebit.ejs');
        break;
      case 'appendix9':
        const appendix9Result = await generateAppendix9Report(user_id, financial_year_id);
        reportData.appendix9ResultData = appendix9Result;
        templatePath = path.resolve(__dirname, '../views', 'appendix9.ejs');
        break;
      case 'appendix10':
        const result = await generateAppendix10Report(user_id, financial_year_id);
        reportData.appendix10Data = result.appendix10Data;
        reportData.generalTotals = result.generalTotals;
        if (reportData.appendix10Data.length === 0) throw { status: 404, message: 'કોઈ રોજમેળ ની એન્ટ્રી ઉપલબ્ધ નથી' };
        templatePath = path.resolve(__dirname, '../views', 'appendix10.ejs');
        break;
      case 'khatavahi':
        const khatavahiResult = await generateKhatavahiReport(user_id, financial_year_id, headId);
        reportData.khatavahiResultData = khatavahiResult;
        templatePath = path.resolve(__dirname, '../views', 'khatavahi.ejs');
        break;
      case 'billregister':
        const billRegisterResult = await generateBillRegisterReport(user_id, financial_year_id);
        reportData.billRegisterData = billRegisterResult.billRegisterData;
        reportData.totals = billRegisterResult.totals;
        templatePath = path.resolve(__dirname, '../views', 'billRegister.ejs');
        break;
      case 'grantregister':
        const grantRegisterResult = await generateGrantRegisterReport(user_id, financial_year_id);
        reportData.grantRegisterData = grantRegisterResult;
        templatePath = path.resolve(__dirname, '../views', 'grantRegister.ejs');
        break;
      case 'chequeregister':
        const chequeRegisterData = await generateChequeRegisterReport(user_id, financial_year_id);
        reportData.chequeRegisterData = chequeRegisterData;
        templatePath = path.resolve(__dirname, '../views', 'chequeRegister.ejs');
        break;
      default:
        throw { status: 400, message: 'રિપોર્ટનો પ્રકાર અમાન્ય છે' };
    }

    let pdfBuffer;
    // Launch Puppeteer and generate PDF
    // const browser = await puppeteer.launch(); // For Testing or Development purpose
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true // Run in headless mode
    });

    // Render the EJS template to HTML
    if (reportType === 'cashbook') {
      const cashbookTemplatePath = path.resolve(__dirname, '../views', 'cashbook.ejs');
      const cashbookHtml = await ejs.renderFile(cashbookTemplatePath, { reportData });
      const creditHtml = await ejs.renderFile(creditTemplatePath, { reportData });
      const depositHtml = await ejs.renderFile(depositTemplatePath, { reportData });

      // Generate PDFs
      const cashbookPdfBuffer = await generatePdfBuffer(browser, cashbookHtml, reportData); // Always single page
      const creditPdfBuffer = await generatePdfBuffer(browser, creditHtml, reportData);
      const depositPdfBuffer = await generatePdfBuffer(browser, depositHtml, reportData);

      await browser.close();

      // Merge PDFs with cashbook as the first page
      const mergedPdfBuffer = await mergePdfsNotebookStyle(cashbookPdfBuffer, creditPdfBuffer, depositPdfBuffer);

      pdfBuffer = mergedPdfBuffer;
    } else {
      const html = await ejs.renderFile(templatePath, { reportData });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' }); // Ensure all resources are loaded
      await page.addStyleTag({ path: reportData.cssPath });

      pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: reportType === 'khatavahi' || reportType === 'grantregister', // Landscape for Khatavahi and Grant Register
        printBackground: true,
      });
      await page.close();
      await browser.close();
    }

    // Update the PDF metadata
    // const pdfWithPageNumbers = await addPageNumbers(pdfBuffer);
    const updatedPdfBuffer = await updatePdfMetadata(pdfBuffer, reportType);

    // Ensure the temp directory exists
    const tempDir = path.resolve(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Save the PDF to a file
    const pdfPath = path.join(tempDir, `${Date.now()}_${reportType}.pdf`);
    fs.writeFileSync(pdfPath, updatedPdfBuffer);

    return pdfPath;
  } catch (error) {
    throw { status: error.status || 500, message: error.message || 'PDF બનાવવામાં અસમર્થ' };
  }
};

// Generate PDF from HTML templates
async function generatePdfBuffer(browser, htmlContent, reportData) {
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ path: reportData.cssPath });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: false,
    printBackground: true,
  });
  await page.close();
  return pdfBuffer;
}

// Function to merge PDFs in a notebook style
async function mergePdfsNotebookStyle(cashbookPdfBuffer, creditPdfBuffer, depositPdfBuffer) {
  const cashbookPdf = await PDFDocument.load(cashbookPdfBuffer); // Always 1 page
  const creditPdf = await PDFDocument.load(creditPdfBuffer);
  const depositPdf = await PDFDocument.load(depositPdfBuffer);

  const mergedPdf = await PDFDocument.create();

  // Add the cashbook page first
  const [cashbookPage] = await mergedPdf.copyPages(cashbookPdf, [0]);
  mergedPdf.addPage(cashbookPage);

  const creditPages = creditPdf.getPageCount();
  const depositPages = depositPdf.getPageCount();

  const maxPages = Math.max(creditPages, depositPages);

  for (let i = 0; i < maxPages; i++) {
    if (i < creditPages) {
      const [creditPage] = await mergedPdf.copyPages(creditPdf, [i]);
      mergedPdf.addPage(creditPage);
    }
    if (i < depositPages) {
      const [depositPage] = await mergedPdf.copyPages(depositPdf, [i]);
      mergedPdf.addPage(depositPage);
    }
  }

  return await mergedPdf.save();
}

const mergePdfs = async (pdfBuffers) => {
  const mergedPdf = await PDFDocument.create();
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
};

const updatePdfMetadata = async (pdfBuffer, reportType) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const title = reportType + ' Report';
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor('Easy Rojmel');
  pdfDoc.setSubject(reportType);
  return await pdfDoc.save();
};

const addPageNumbers = async (pdfBuffer) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const fontSize = 12;
  const font = await pdfDoc.embedFont(PDFDocument.PDFName.of('Helvetica'));

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    page.drawText(`${index + 1}`, {
      x: width / 2 - fontSize / 2,
      y: 10,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
  });

  return await pdfDoc.save();
};

const generateAppendix9Report = async (userId, financialYearId) => {
  try {
    // Step 1: Fetch all heads for the user in the selected financial year
    const heads = await Head.find({ user_id: userId, financial_year_id: financialYearId });

    // Variables to calculate general totals
    let totalAmount = 0;
    let totalCashAmount = 0;
    let totalBankAmount = 0;

    for (const head of heads) {
      const headId = head._id;

      // Calculate the opening balance
      const openingBalanceCash = parseFloat(head.opening_balance_cash);
      const openingBalanceBank = parseFloat(head.opening_balance_bank);

      // Aggregate transactions for the current head
      const transactions = await Ledger.aggregate([
        {
          $match: {
            user_id: userId,
            financial_year_id: financialYearId,
            head_id: headId
          }
        },
        {
          $group: {
            _id: "$transaction_type",
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      // Calculate current year totals for IN and OUT transactions
      const inTotal = transactions.find(t => t._id === 'IN')?.totalAmount || 0;
      const outTotal = transactions.find(t => t._id === 'OUT')?.totalAmount || 0;

      // Compute total head-wise values
      const totalCash = openingBalanceCash + inTotal;
      const totalBank = openingBalanceBank + outTotal;

      // Update general totals
      totalCashAmount += totalCash;
      totalBankAmount += totalBank;
    }

    totalAmount = totalCashAmount + totalBankAmount;

    return appendix9Data = {
      totalCashAmount: totalCashAmount.toFixed(2),
      totalBankAmount: totalBankAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    }
  } catch (error) {
    console.error("Error generating appendix10 report:", error);
    throw new Error("પરિશિષ્ટ 10 રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
}

const generateAppendix10Report = async (userId, financialYearId) => {
  try {
    // Step 1: Fetch all heads for the user in the selected financial year
    const heads = await Head.find({ user_id: userId, financial_year_id: financialYearId });

    // Step 2: Prepare the response array
    const appendix10Data = [];

    let index = 1; // Initialize the index for numbering

    // Variables to calculate general totals
    let totalGrant = 0; // Total Grant (Opening Balance + Total In)
    let usedGrant = 0; // Used Grant (Total Out)
    let remainingGrant = 0; // Remaining Grant (Total Grant - Used Grant)

    for (const head of heads) {
      const headId = head._id;

      // Calculate the opening balance
      const openingBalance = parseFloat(head.opening_balance_cash) + parseFloat(head.opening_balance_bank);

      // Aggregate transactions for the current head
      const transactions = await Ledger.aggregate([
        {
          $match: {
            user_id: userId,
            financial_year_id: financialYearId,
            head_id: headId
          }
        },
        {
          $group: {
            _id: "$transaction_type",
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      // Calculate current year totals for IN and OUT transactions
      const inTotal = transactions.find(t => t._id === 'IN')?.totalAmount || 0;
      const outTotal = transactions.find(t => t._id === 'OUT')?.totalAmount || 0;

      // Compute total head-wise values
      const totalHeadWise = openingBalance + inTotal;
      const totalHeadWiseDeposit = outTotal;
      const finalAmount = totalHeadWise - totalHeadWiseDeposit;

      // Update general totals
      totalGrant += totalHeadWise;
      usedGrant += totalHeadWiseDeposit;
      remainingGrant += finalAmount;

      // Push data into the report
      appendix10Data.push({
        no: index++, // Add the index to each record
        head_name: head.head_name,
        opening_balance: openingBalance,
        in_total: inTotal,
        out_total: outTotal,
        total_head_wise: totalHeadWise,
        total_head_wise_deposit: totalHeadWiseDeposit,
        final_amount: finalAmount
      });
    }

    // Return the generated data along with general totals
    return {
      appendix10Data,
      generalTotals: {
        totalGrant: totalGrant.toFixed(2),
        usedGrant: usedGrant.toFixed(2),
        remainingGrant: remainingGrant.toFixed(2)
      }
    };
  } catch (error) {
    console.error("Error generating appendix10 report:", error);
    throw new Error("પરિશિષ્ટ 10 રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
}

const generateChequeRegisterReport = async (userId, financialYearId) => {
  try {
    let index = 1; // Initialize the index for numbering

    // Aggregate transactions for the current head
    const transactions = await Ledger.find({
      user_id: userId,
      financial_year_id: financialYearId,
      transaction_type: 'OUT',
      payment_method: 'cheque'
    }).sort({ transaction_date: 1 }).populate('head_id', 'head_name');

    if (transactions.length === 0) throw new Error("કોઈ ચેક રજીસ્ટર ની એન્ટ્રી ઉપલબ્ધ નથી");

    // Prepare the cheque register data
    const chequeRegisterData = transactions.map(transaction => {
      return {
        no: index++,
        head_name: transaction.head_id.head_name,
        cheque_number: transaction.cheque_number,
        amount: transaction.amount.toFixed(2),
        transaction_date: new Date(transaction.transaction_date).toLocaleDateString(),
        cheque_pfms_clearing_date: new Date(transaction.cheque_pfms_clearing_date).toLocaleDateString(),
        details: transaction.details,
      };
    });

    return chequeRegisterData;
  } catch (error) {
    console.error("Error generating cheque register report:", error);
    throw new Error("ચેક રજીસ્ટર રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
}

const generateBillRegisterReport = async (userId, financialYearId) => {
  try {
    let index = 1; // Initialize the index for numbering

    // Variables to calculate general totals
    let totalCashDebitAmount = 0; // Total Debit Amount in cash (Total Out)
    let totalBankDebitAmount = 0; // Total Debit Amount in bank/cheque (Total Out)

    // fetch all transactions for the bills registered in the selected financial year
    const transactions = await Ledger.find({
      user_id: userId,
      financial_year_id: financialYearId,
      transaction_type: 'OUT',
    }).sort({ transaction_date: 1 }).populate('head_id', 'head_name');

    if (transactions.length === 0) throw new Error("કોઈ બિલ રજીસ્ટર ની એન્ટ્રી ઉપલબ્ધ નથી");

    // Prepare the cheque register data
    const billRegisterData = transactions.map(transaction => {
      return {
        no: index++,
        head_name: transaction.head_id.head_name,
        cash_debit_amount: transaction.transaction_type === 'OUT' && transaction.payment_method === 'cash' ? transaction.amount.toFixed(2) : 0,
        bank_debit_amount: transaction.transaction_type === 'OUT' && (transaction.payment_method === 'cheque' || transaction.payment_method === 'online') ? transaction.amount.toFixed(2) : 0,
        transaction_date: new Date(transaction.transaction_date).toLocaleDateString(),
        details: transaction.details,
      };
    });

    // Calculate the total credit and debit amounts
    totalCashDebitAmount = billRegisterData.reduce((total, transaction) => total + parseFloat(transaction.cash_debit_amount), 0);
    totalBankDebitAmount = billRegisterData.reduce((total, transaction) => total + parseFloat(transaction.bank_debit_amount), 0);

    return {
      billRegisterData,
      totals: {
        cashDebitAmount: totalCashDebitAmount.toFixed(2),
        bankDebitAmount: totalBankDebitAmount.toFixed(2),
      }
    };
  } catch (error) {
    console.error("Error generating bill register report:", error);
    throw new Error("બિલ રજીસ્ટર રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
}

const generateGrantRegisterReport = async (userId, financialYearId) => {
  try {
    // Step 1: Fetch all heads for the user in the selected financial year
    const heads = await Head.find({ user_id: userId, financial_year_id: financialYearId });

    // Step 2: Prepare the response array
    const grantRegisterData = [];

    let index = 1; // Initialize the index for numbering

    // Variables to calculate general totals
    let totalGrant = 0; // Total Grant (Opening Balance + Total In)
    let usedGrant = 0; // Used Grant (Total Out)
    let remainingGrant = 0; // Remaining Grant (Total Grant - Used Grant)

    for (const head of heads) {
      const headId = head._id;

      // Calculate the opening balance
      const openingBalance = parseFloat(head.opening_balance_cash) + parseFloat(head.opening_balance_bank);

      // Aggregate transactions for the current head
      const transactions = await Ledger.aggregate([
        {
          $match: {
            user_id: userId,
            financial_year_id: financialYearId,
            head_id: headId
          }
        },
        {
          $group: {
            _id: "$transaction_type",
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      // Calculate current year totals for IN and OUT transactions
      const inTotal = transactions.find(t => t._id === 'IN')?.totalAmount || 0;
      const outTotal = transactions.find(t => t._id === 'OUT')?.totalAmount || 0;

      // Compute total head-wise values
      const totalHeadWise = openingBalance + inTotal;
      const totalHeadWiseDeposit = outTotal;
      const finalAmount = totalHeadWise - totalHeadWiseDeposit;

      // Update general totals
      totalGrant += totalHeadWise;
      usedGrant += totalHeadWiseDeposit;
      remainingGrant += finalAmount;

      // Push data into the report
      grantRegisterData.push({
        no: index++, // Add the index to each record
        head_name: head.head_name,
        opening_balance: openingBalance.toFixed(2),
        in_total: inTotal.toFixed(2),
        out_total: outTotal.toFixed(2),
        total_head_wise: totalHeadWise.toFixed(2),
        total_head_wise_deposit: totalHeadWiseDeposit.toFixed(2),
        final_amount: finalAmount.toFixed(2)
      });
    }

    return grantRegisterData;
  } catch (error) {
    console.error("Error generating appendix10 report:", error);
    throw new Error("પરિશિષ્ટ 10 રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
}

const generateCashbookReport = async (userId, financialYearId) => {
  try {
    // Fetch ledgers, opening balances, and financial year details
    const ledgers = await Ledger.find({ user_id: userId, financial_year_id: financialYearId }).sort({ transaction_date: 1 }).populate('head_id', 'head_name');
    if (ledgers.length === 0) throw new Error("કોઈ કૅશબૂક ની એન્ટ્રી ઉપલબ્ધ નથી");

    const openingBalance = await getOpeningBalances(userId, financialYearId);
    const cashOpeningBalance = openingBalance.reduce((total, head) => total + parseFloat(head.opening_balance_cash), 0);
    const bankOpeningBalance = openingBalance.reduce((total, head) => total + parseFloat(head.opening_balance_bank), 0);

    const financialYear = await FinancialYear.findById(financialYearId);
    const financialYearStartDate = new Date(financialYear.fy_start_date).toLocaleDateString();
    const options = { year: 'numeric', month: 'short' };
    const yearStartDate = new Date(financialYear.fy_start_date).toLocaleDateString('en-US', options);
    const yearEndDate = new Date(financialYear.fy_end_date).toLocaleDateString('en-US', options);

    // Step 2: Filter and group the transactions by date
    const creditTransactions = ledgers.filter(ledger => ledger.transaction_type === 'IN');
    const debitTransactions = ledgers.filter(ledger => ledger.transaction_type === 'OUT');

    // Step 3: Combine both credit and debit transactions by date
    const combinedTransactions = combineCreditAndDebitByDate(creditTransactions, debitTransactions, cashOpeningBalance, bankOpeningBalance);

    // Return the generated data for PDFs
    return {
      financialYearStartDate,
      yearStartDate,
      yearEndDate,
      cashOpeningBalance: cashOpeningBalance.toFixed(2),
      bankOpeningBalance: bankOpeningBalance.toFixed(2),
      transactions: combinedTransactions
    };

  } catch (error) {
    console.error("Error generating cashbook report:", error);
    throw new Error("કૅશબૂક રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
};

function getUniqueDates(creditTransactions, debitTransactions) {
  const allDates = new Set();

  creditTransactions.forEach(transaction => {
    allDates.add(new Date(transaction.transaction_date).toLocaleDateString());
  });

  debitTransactions.forEach(transaction => {
    allDates.add(new Date(transaction.transaction_date).toLocaleDateString());
  });

  const sortedDates = Array.from(allDates).sort((a, b) => {
    const dateA = new Date(a); // Create Date objects for comparison
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime(); // Compare using timestamps
  });

  return sortedDates;
}

function combineCreditAndDebitByDate(creditTransactions, debitTransactions, cashOpeningBalance, bankOpeningBalance) {
  const allDates = getUniqueDates(creditTransactions, debitTransactions);
  const combined = [];

  let currentCashBalance = cashOpeningBalance;
  let currentBankBalance = bankOpeningBalance;

  allDates.forEach(date => {
    const combinedEntry = {
      credit: [],
      debit: []
    };

    // Filter and add credit transactions:
    const creditsForDate = creditTransactions.filter(credit => new Date(credit.transaction_date).toLocaleDateString() === date);
    creditsForDate.forEach(credit => {
      combinedEntry.credit.push({ // Push the entire credit object
        head_name: credit.head_id.head_name,
        cash_amount: credit.payment_method === 'cash' ? credit.amount.toFixed(2) : 0,
        bank_amount: credit.payment_method !== 'cash' ? credit.amount.toFixed(2) : 0,
        transaction_date: new Date(credit.transaction_date).toLocaleDateString(),
        details: credit.details,
        cheque_number: credit.cheque_number,
        cheque_pfms_clearing_date: credit.cheque_pfms_clearing_date ? new Date(credit.cheque_pfms_clearing_date).toLocaleDateString() : null,
        payment_method: credit.payment_method,
        transaction_type: credit.transaction_type
      });
    });

    // Filter and add debit transactions:
    const debitsForDate = debitTransactions.filter(debit => new Date(debit.transaction_date).toLocaleDateString() === date);
    debitsForDate.forEach(debit => {
      combinedEntry.debit.push({ // Push the entire debit object
        head_name: debit.head_id.head_name,
        cash_amount: debit.payment_method === 'cash' ? debit.amount.toFixed(2) : 0,
        bank_amount: debit.payment_method !== 'cash' ? debit.amount.toFixed(2) : 0,
        transaction_date: new Date(debit.transaction_date).toLocaleDateString(),
        details: debit.details,
        cheque_number: debit.cheque_number,
        cheque_pfms_clearing_date: debit.cheque_pfms_clearing_date ? new Date(debit.cheque_pfms_clearing_date).toLocaleDateString() : null,
        payment_method: debit.payment_method,
        transaction_type: debit.transaction_type
      });
    });

    // Add blank entries to match the higher count:
    const maxCount = Math.max(combinedEntry.credit.length, combinedEntry.debit.length);
    for (let i = 0; i < maxCount; i++) {
      if (!combinedEntry.credit[i]) { // If credit entry is missing, add a blank one
        combinedEntry.credit[i] = {
          head_name: null,
          cash_amount: 0,
          bank_amount: 0,
          transaction_date: date,
          details: null,
          cheque_number: null,
          cheque_pfms_clearing_date: null,
          payment_method: null,
          transaction_type: null
        };
      }
      if (!combinedEntry.debit[i]) { // If debit entry is missing, add a blank one
        combinedEntry.debit[i] = {
          head_name: null,
          cash_amount: 0,
          bank_amount: 0,
          transaction_date: date,
          details: null,
          cheque_number: null,
          cheque_pfms_clearing_date: null,
          payment_method: null,
          transaction_type: null
        };
      }
    }

    // ... (Calculate totals and update balances - same as before)
    let totalCashCreditAmount = 0;
    let totalBankCreditAmount = 0;
    combinedEntry.credit.forEach(credit => {
      totalCashCreditAmount += parseFloat(credit.cash_amount) || 0; // Parse to float, handle NaN
      totalBankCreditAmount += parseFloat(credit.bank_amount) || 0; // Parse to float, handle NaN
    });

    let totalCashDebitAmount = 0;
    let totalBankDebitAmount = 0;
    combinedEntry.debit.forEach(debit => {
      totalCashDebitAmount += parseFloat(debit.cash_amount) || 0; // Parse to float, handle NaN
      totalBankDebitAmount += parseFloat(debit.bank_amount) || 0; // Parse to float, handle NaN
    });

    // Update balances (same as before):
    let openingCashAmount = currentCashBalance || 0;
    let openingBankAmount = currentBankBalance || 0;

    let overallCashAmount = totalCashCreditAmount + openingCashAmount;
    let overallBankAmount = totalBankCreditAmount + openingBankAmount;

    currentCashBalance += totalCashCreditAmount - totalCashDebitAmount;
    currentBankBalance += totalBankCreditAmount - totalBankDebitAmount;

    const totalAmount = currentCashBalance + currentBankBalance

    // Combined Entry for amount
    combinedEntry.totalCashCreditAmount = totalCashCreditAmount;
    combinedEntry.totalBankCreditAmount = totalBankCreditAmount;
    combinedEntry.totalCashDebitAmount = totalCashDebitAmount;
    combinedEntry.totalBankDebitAmount = totalBankDebitAmount;
    combinedEntry.totalAmount = totalAmount;
    combinedEntry.totalClosingCashBalance = currentCashBalance;
    combinedEntry.totalClosingBankBalance = currentBankBalance;
    combinedEntry.openingCashAmount = openingCashAmount;
    combinedEntry.openingBankAmount = openingBankAmount;
    combinedEntry.overallCashAmount = overallCashAmount;
    combinedEntry.overallBankAmount = overallBankAmount;

    combined.push(combinedEntry);
  });

  return combined;
}


const generateKhatavahiReport = async (userId, financialYearId, headId) => {
  try {
    // Step 1: Fetch all ledgers for specific head
    const ledgers = await Ledger.find({ user_id: userId, financial_year_id: financialYearId, head_id: new ObjectId(headId) }).sort({ transaction_date: 1 }).populate('head_id', 'head_name');

    if (ledgers.length === 0) throw new Error("કોઈ ખાતાવહી ની એન્ટ્રી ઉપલબ્ધ નથી");

    // Step 2: I want to fetch the opening balance for all heads in the selected financial year and user id with separate variable for cash and bank
    const openingBalance = await getOpeningBalances(userId, financialYearId);
    const cashOpeningBalance = openingBalance.reduce((total, head) => total + parseFloat(head.opening_balance_cash), 0);
    const bankOpeningBalance = openingBalance.reduce((total, head) => total + parseFloat(head.opening_balance_bank), 0);

    // Step 3: Fetch current financial year start date for opening balance
    const financialYear = await FinancialYear.findById(financialYearId);
    const financialYearStartDate = new Date(financialYear.fy_start_date).toLocaleDateString();

    // Step 4: Filter the ledgers based on transaction type (IN/OUT) and payment method (cash/online/cheque)
    const creditTransactions = ledgers.filter(ledger => ledger.transaction_type === 'IN').map(ledger => {
      return {
        head_name: ledger.head_id.head_name,
        cash_amount: ledger.payment_method === 'cash' ? ledger.amount.toFixed(2) : 0,
        bank_amount: ledger.payment_method !== 'cash' ? ledger.amount.toFixed(2) : 0,
        transaction_date: new Date(ledger.transaction_date).toLocaleDateString(),
        details: ledger.details,
        cheque_number: ledger.cheque_number,
        cheque_pfms_clearing_date: new Date(ledger.cheque_pfms_clearing_date).toLocaleDateString(),
      };
    });
    const debitTransactions = ledgers.filter(ledger => ledger.transaction_type === 'OUT').map(ledger => {
      return {
        head_name: ledger.head_id.head_name,
        cash_amount: ledger.payment_method === 'cash' ? ledger.amount.toFixed(2) : 0,
        bank_amount: ledger.payment_method !== 'cash' ? ledger.amount.toFixed(2) : 0,
        transaction_date: new Date(ledger.transaction_date).toLocaleDateString(),
        details: ledger.details,
        cheque_number: ledger.cheque_number,
        cheque_pfms_clearing_date: new Date(ledger.cheque_pfms_clearing_date).toLocaleDateString(),
      };
    });

    // Variables to calculate general totals
    let totalAmount = 0; // Total Amount (Opening Balance + Total In - Total Out)
    let totalCashCreditAmount = 0; // Total Credit Amount in cash (Total In)
    let totalBankCreditAmount = 0; // Total Credit Amount in bank/cheque (Total In)
    let totalCashDebitAmount = 0; // Total Debit Amount in cash (Total Out)
    let totalBankDebitAmount = 0; // Total Debit Amount in bank/cheque (Total Out)
    let totalExpense = 0;
    let totalClosingAmount = 0;

    // Calculate the totalCashCreditAmount and totalBankCreditAmount for credit transactions using reduce   method and filter using payment method cash and online/cheque
    totalCashCreditAmount = creditTransactions.reduce((total, transaction) => total + parseFloat(transaction.cash_amount), 0);
    totalBankCreditAmount = creditTransactions.reduce((total, transaction) => total + parseFloat(transaction.bank_amount), 0);

    // Calculate the totalCashDebitAmount and totalBankDebitAmount for debit transactions using reduce method and filter using payment method cash and online/cheque
    totalCashDebitAmount = debitTransactions.reduce((total, transaction) => total + parseFloat(transaction.cash_amount), 0);
    totalBankDebitAmount = debitTransactions.reduce((total, transaction) => total + parseFloat(transaction.bank_amount), 0);

    totalExpense = totalCashDebitAmount + totalBankDebitAmount;
    totalAmount = cashOpeningBalance + totalCashCreditAmount + bankOpeningBalance + totalBankCreditAmount;
    totalClosingAmount = totalAmount - totalExpense;

    // Return the generated data along with general totals
    return {
      cashOpeningBalance: cashOpeningBalance.toFixed(2),
      bankOpeningBalance: bankOpeningBalance.toFixed(2),
      financialYearStartDate,
      creditTransactions,
      debitTransactions,
      totalCashCreditAmount: totalCashCreditAmount.toFixed(2),
      totalBankCreditAmount: totalBankCreditAmount.toFixed(2),
      totalCashDebitAmount: totalCashDebitAmount.toFixed(2),
      totalBankDebitAmount: totalBankDebitAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      totalClosingAmount: totalClosingAmount.toFixed(2)
    };
  } catch (error) {
    console.error("Error generating cashbook report:", error);
    throw new Error("ખાતાવહી રિપોર્ટ જનરેટ કરી શકાયું નથી");
  }
}

const getOpeningBalances = async (userId, financialYearId) => {
  return Head.find({
    user_id: userId,
    financial_year_id: financialYearId
  }).select('opening_balance_cash opening_balance_bank');
};