import * as pdfjsLib from
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";


/* =========================
   PDF.JS WORKER
========================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


/* =========================
   BOOK DATABASE
========================= */

const books = {

  saliyah: {
    title: "Saliyah Layu Melulu",
    file: "books/saliyah-layu-melulu.pdf"
  },

  kita: {
    title: "Kita di Antara Kata",
    file: "books/kita-di-antara-kata.pdf"
  },

  kesepian: {
    title: "Kesepian Modern",
    file: "books/kesepian-modern.pdf"
  },

  cinta: {
    title: "Kalau Nanti Jatuh Cinta Lagi",
    file: "books/kalau-nanti-jatuh-cinta-lagi.pdf"
  },

  tumbuh: {
    title: "Kerja, Belajar, dan Tumbuh",
    file: "books/kerja-belajar-dan-tumbuh.pdf"
  },

  pengabdian: {
    title: "Tentang Pengabdian Masyarakat",
    file: "books/tentang-pengabdian-masyarakat.pdf"
  },

  keuangan: {
    title: "Manajemen Keuangan Kecil-Kecilan",
    file: "books/manajemen-keuangan-kecil-kecilan.pdf"
  }

};


/* =========================
   ELEMENTS
========================= */

const canvas =
  document.getElementById("pdf-canvas");

const context =
  canvas.getContext("2d");

const bookTitle =
  document.getElementById("book-title");

const pageCounter =
  document.getElementById("page-counter");

const previousButton =
  document.getElementById("previous-button");

const nextButton =
  document.getElementById("next-button");

const closeButton =
  document.getElementById("close-button");

const loading =
  document.getElementById("loading");

const error =
  document.getElementById("error");

const errorMessage =
  document.getElementById("error-message");

const bookArea =
  document.getElementById("book-area");


/* =========================
   STATE
========================= */

let pdfDocument = null;

let currentPage = 1;

let rendering = false;

let pendingPage = null;


/* =========================
   GET BOOK FROM URL
========================= */

const parameters =
  new URLSearchParams(window.location.search);

const bookKey =
  parameters.get("book") || "saliyah";


/* =========================
   OPEN BOOK
========================= */

async function openBook() {

  const book =
    books[bookKey];

  if (!book) {

    showError(
      "The requested book does not exist."
    );

    return;
  }


  bookTitle.textContent =
    book.title;


  try {

    pdfDocument =
      await pdfjsLib.getDocument(
        book.file
      ).promise;


    updatePageCounter();

    updateButtons();

    await renderPage(currentPage);


    loading.classList.add("hidden");

  }

  catch (error) {

    console.error(error);

    showError(
      "Make sure the PDF exists inside the books folder and that the website is being opened through a web server."
    );

  }

}


/* =========================
   RENDER PAGE
========================= */

async function renderPage(pageNumber) {

  if (!pdfDocument) {
    return;
  }


  if (rendering) {

    pendingPage =
      pageNumber;

    return;
  }


  rendering = true;


  try {

    const page =
      await pdfDocument.getPage(
        pageNumber
      );


    const viewport =
      page.getViewport({
        scale: 1
      });


    const containerWidth =
      bookArea.clientWidth;


    const containerHeight =
      bookArea.clientHeight;


    const horizontalPadding =
      window.innerWidth <= 700
        ? 24
        : 80;


    const verticalPadding =
      window.innerWidth <= 700
        ? 40
        : 80;


    const availableWidth =
      containerWidth -
      horizontalPadding;


    const availableHeight =
      containerHeight -
      verticalPadding;


    const scaleByWidth =
      availableWidth /
      viewport.width;


    const scaleByHeight =
      availableHeight /
      viewport.height;


    let scale =
      Math.min(
        scaleByWidth,
        scaleByHeight
      );


    /*
      Prevent the page from becoming
      unnecessarily huge on large screens.
    */

    scale =
      Math.min(scale, 1.8);


    const scaledViewport =
      page.getViewport({
        scale
      });


    const outputScale =
      window.devicePixelRatio || 1;


    canvas.width =
      Math.floor(
        scaledViewport.width *
        outputScale
      );


    canvas.height =
      Math.floor(
        scaledViewport.height *
        outputScale
      );


    canvas.style.width =
      `${scaledViewport.width}px`;


    canvas.style.height =
      `${scaledViewport.height}px`;


    const transform =
      outputScale !== 1
        ? [
            outputScale,
            0,
            0,
            outputScale,
            0,
            0
          ]
        : null;


    const renderContext = {

      canvasContext:
        context,

      transform,

      viewport:
        scaledViewport

    };


    await page.render(
      renderContext
    ).promise;


    currentPage =
      pageNumber;


    updatePageCounter();

    updateButtons();

  }

  catch (error) {

    console.error(
      "Page rendering error:",
      error
    );

  }

  finally {

    rendering = false;


    if (pendingPage !== null) {

      const nextPage =
        pendingPage;

      pendingPage = null;

      renderPage(nextPage);

    }

  }

}


/* =========================
   PAGE COUNTER
========================= */

function updatePageCounter() {

  if (!pdfDocument) {
    return;
  }


  const current =
    String(currentPage)
      .padStart(2, "0");


  const total =
    String(pdfDocument.numPages)
      .padStart(2, "0");


  pageCounter.textContent =
    `${current} / ${total}`;

}


/* =========================
   BUTTONS
========================= */

function updateButtons() {

  if (!pdfDocument) {
    return;
  }


  previousButton.disabled =
    currentPage <= 1;


  nextButton.disabled =
    currentPage >=
    pdfDocument.numPages;

}


/* =========================
   NEXT PAGE
========================= */

function nextPage() {

  if (!pdfDocument) {
    return;
  }


  if (
    currentPage <
    pdfDocument.numPages
  ) {

    renderPage(
      currentPage + 1
    );

  }

}


/* =========================
   PREVIOUS PAGE
========================= */

function previousPage() {

  if (!pdfDocument) {
    return;
  }


  if (currentPage > 1) {

    renderPage(
      currentPage - 1
    );

  }

}


/* =========================
   CLOSE
========================= */

function closeReader() {

  if (
    document.referrer &&
    document.referrer !==
    window.location.href
  ) {

    window.history.back();

  }

  else {

    window.location.href =
      "index.html";

  }

}


/* =========================
   ERROR
========================= */

function showError(message) {

  loading.classList.add(
    "hidden"
  );

  document
    .getElementById("reader")
    .style.display = "none";

  error.classList.add(
    "visible"
  );

  errorMessage.textContent =
    message;

}


/* =========================
   BUTTON EVENTS
========================= */

nextButton.addEventListener(
  "click",
  nextPage
);


previousButton.addEventListener(
  "click",
  previousPage
);


closeButton.addEventListener(
  "click",
  closeReader
);


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "ArrowRight"
    ) {

      nextPage();

    }


    if (
      event.key ===
      "ArrowLeft"
    ) {

      previousPage();

    }


    if (
      event.key ===
      "Escape"
    ) {

      closeReader();

    }

  }
);


/* =========================
   RESIZE
========================= */

let resizeTimeout;

window.addEventListener(
  "resize",
  () => {

    clearTimeout(
      resizeTimeout
    );


    resizeTimeout =
      setTimeout(
        () => {

          if (pdfDocument) {

            renderPage(
              currentPage
            );

          }

        },
        150
      );

  }
);


/* =========================
   START
========================= */

openBook();
