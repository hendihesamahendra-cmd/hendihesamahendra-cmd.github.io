import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


/* =========================
   BOOKS
========================= */

const books = {

  saliyah: {
    title: "saliyah-layu-melulu.pdf",
    pdf: "books/saliyah-layu-melulu.pdf"
  },

  kita: {
    title: "kita-di-antara-kata.pdf",
    pdf: "books/kita-di-antara-kata.pdf"
  },

  kesepian: {
    title: "esepian-modern.pdf",
    pdf: "books/kesepian-modern.pdf"
  },

  jatuhcinta: {
    title: "kalau-nanti-jatuh-cinta-lagi.pdf",
    pdf: "books/kalau-nanti-jatuh-cinta-lagi.pdf"
  },

  keuangan: {
    title: "manajemen-keuangan-kecil-kecilan.pdf",
    pdf: "books/manajemen-keuangan-kecil-kecilan.pdf"
  }

};


/* =========================
   GET BOOK FROM URL
========================= */

const params = new URLSearchParams(window.location.search);
const bookKey = params.get("book");
const book = books[bookKey];


/* =========================
   ELEMENTS
========================= */

const canvas = document.getElementById("pdf-canvas");
const context = canvas.getContext("2d");

const titleElement = document.getElementById("book-title");
const pageCounterElement = document.getElementById("page-counter");

const loadingElement = document.getElementById("loading");

const errorElement = document.getElementById("error");
const errorMessageElement = document.getElementById("error-message");

const previousButton =
  document.getElementById("previous-button");

const nextButton =
  document.getElementById("next-button");

const closeButton =
  document.getElementById("close-button");


/* =========================
   STATE
========================= */

let pdfDoc = null;
let pageNum = 1;
let rendering = false;
let pendingPage = null;


/* =========================
   INITIALIZE
========================= */

if (!book) {

  showError("This book could not be found.");

} else {

  titleElement.textContent = book.title;

  loadPDF(book.pdf);

}


/* =========================
   LOAD PDF
========================= */

async function loadPDF(url) {

  try {

    const loadingTask = pdfjsLib.getDocument(url);

    pdfDoc = await loadingTask.promise;

    loadingElement.classList.add("hidden");

    updatePageCounter();

    updateButtons();

    renderPage(pageNum);

  } catch (error) {

    console.error("PDF Error:", error);

    showError(
      "The book could not be loaded. Please check the PDF file."
    );

  }

}


/* =========================
   RENDER PAGE
========================= */

async function renderPage(num) {

  if (!pdfDoc) return;

  rendering = true;

  const page = await pdfDoc.getPage(num);

  const viewport = page.getViewport({
    scale: 1.5
  });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  pageNum = num;

  updatePageCounter();

  updateButtons();

  rendering = false;

  if (pendingPage !== null) {

    const nextPageNum = pendingPage;

    pendingPage = null;

    renderPage(nextPageNum);

  }

}


/* =========================
   QUEUE PAGE
========================= */

function queueRenderPage(num) {

  if (rendering) {

    pendingPage = num;

  } else {

    renderPage(num);

  }

}


/* =========================
   PREVIOUS PAGE
========================= */

function previousPage() {

  if (!pdfDoc) return;

  if (pageNum <= 1) return;

  queueRenderPage(pageNum - 1);

}


/* =========================
   NEXT PAGE
========================= */

function nextPage() {

  if (!pdfDoc) return;

  if (pageNum >= pdfDoc.numPages) return;

  queueRenderPage(pageNum + 1);

}


/* =========================
   PAGE COUNTER
========================= */

function updatePageCounter() {

  if (!pdfDoc) return;

  const current =
    String(pageNum).padStart(2, "0");

  const total =
    String(pdfDoc.numPages).padStart(2, "0");

  pageCounterElement.textContent =
    `${current} / ${total}`;

}


/* =========================
   BUTTON STATE
========================= */

function updateButtons() {

  if (!pdfDoc) return;

  previousButton.disabled =
    pageNum <= 1;

  nextButton.disabled =
    pageNum >= pdfDoc.numPages;

}


/* =========================
   ERROR
========================= */

function showError(message) {

  loadingElement.classList.add("hidden");

  errorMessageElement.textContent = message;

  errorElement.classList.add("visible");

}


/* =========================
   BUTTON EVENTS
========================= */

previousButton.addEventListener(
  "click",
  previousPage
);

nextButton.addEventListener(
  "click",
  nextPage
);


/* =========================
   CLOSE
========================= */

closeButton.addEventListener(
  "click",
  function () {

    if (window.history.length > 1) {

      window.history.back();

    } else {

      window.location.href = "index.html";

    }

  }
);


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "ArrowLeft") {

      previousPage();

    }

    if (event.key === "ArrowRight") {

      nextPage();

    }

    if (event.key === "Escape") {

      if (window.history.length > 1) {

        window.history.back();

      } else {

        window.location.href = "index.html";

      }

    }

  }
);
