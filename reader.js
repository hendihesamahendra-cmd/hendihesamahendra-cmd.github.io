import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


/* =========================
   BOOKS
========================= */

const books = {

  saliyah: {
    title: "Saliyah Layu Melulu",
    pdf: "books/saliyah-layu-melulu.pdf"
  },

  kita: {
    title: "Kita di Antara Kata",
    pdf: "books/kita-di-antara-kata.pdf"
  },

  kesepian: {
    title: "Kesepian Modern",
    pdf: "books/kesepian-modern.pdf"
  },

  jatuhcinta: {
    title: "Kalau Nanti Jatuh Cinta Lagi",
    pdf: "books/kalau-nanti-jatuh-cinta-lagi.pdf"
  },

  keuangan: {
    title: "Manajemen Keuangan Kecil-Kecilan",
    pdf: "books/manajemen-keuangan-kecil-kecilan.pdf"
  }

};


/* =========================
   GET BOOK
========================= */

const params =
  new URLSearchParams(
    window.location.search
  );

const bookKey =
  params.get("book");

const book =
  books[bookKey];


/* =========================
   ELEMENTS
========================= */

const canvas =
  document.getElementById(
    "pdf-canvas"
  );

const context =
  canvas.getContext("2d");


const titleElement =
  document.getElementById(
    "book-title"
  );


const pageCounterElement =
  document.getElementById(
    "page-counter"
  );


const loadingElement =
  document.getElementById(
    "loading"
  );


const errorElement =
  document.getElementById(
    "error"
  );


const errorMessageElement =
  document.getElementById(
    "error-message"
  );


const previousButton =
  document.getElementById(
    "previous-button"
  );


const nextButton =
  document.getElementById(
    "next-button"
  );


const closeButton =
  document.getElementById(
    "close-button"
  );


const pageWrapper =
  document.getElementById(
    "page-wrapper"
  );


/* =========================
   STATE
========================= */

let pdfDoc = null;

let pageNum = 1;

let rendering = false;

let pendingPage = null;

let currentRenderTask = null;


/* =========================
   DRAG STATE
========================= */

let dragging = false;

let startX = 0;

let currentX = 0;

let dragDistance = 0;


/* =========================
   INITIALIZE
========================= */

if (!book) {

  showError(
    "This book could not be found."
  );

} else {

  titleElement.textContent =
    book.title;

  loadPDF(book.pdf);

}


/* =========================
   LOAD PDF
========================= */

async function loadPDF(url) {

  try {

    const loadingTask =
      pdfjsLib.getDocument(url);

    pdfDoc =
      await loadingTask.promise;


    loadingElement.classList.add(
      "hidden"
    );


    updatePageCounter();

    updateButtons();

    renderPage(pageNum);

  } catch (error) {

    console.error(
      "PDF Error:",
      error
    );

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


  try {

    const page =
      await pdfDoc.getPage(num);


    /* =========================
       PAGE SIZE
    ========================= */

    const bookArea =
      document.getElementById(
        "book-area"
      );


    const areaWidth =
      bookArea.clientWidth;


    const areaHeight =
      bookArea.clientHeight;


    const paddingX =
      window.innerWidth <= 700
        ? 32
        : 160;


    const paddingY =
      window.innerWidth <= 700
        ? 36
        : 64;


    const availableWidth =
      Math.max(
        100,
        areaWidth - paddingX
      );


    const availableHeight =
      Math.max(
        100,
        areaHeight - paddingY
      );


    /* =========================
       BASE VIEWPORT
    ========================= */

    const baseViewport =
      page.getViewport({
        scale: 1
      });


    const scaleByWidth =
      availableWidth /
      baseViewport.width;


    const scaleByHeight =
      availableHeight /
      baseViewport.height;


    /*
      Always fit the COMPLETE
      PDF page inside the available
      space while preserving the
      original aspect ratio.
    */

    const scale =
      Math.min(
        scaleByWidth,
        scaleByHeight
      );


    const viewport =
      page.getViewport({
        scale: scale
      });


    /* =========================
       DEVICE PIXEL RATIO
    ========================= */

    const devicePixelRatio =
      window.devicePixelRatio || 1;


    /* =========================
       HIGH DPI CANVAS
    ========================= */

    canvas.width =
      Math.floor(
        viewport.width *
        devicePixelRatio
      );


    canvas.height =
      Math.floor(
        viewport.height *
        devicePixelRatio
      );


    /* =========================
       VISUAL SIZE
    ========================= */

    canvas.style.width =
      `${viewport.width}px`;


    canvas.style.height =
      `${viewport.height}px`;


    /* =========================
       RESET TRANSFORM
    ========================= */

    canvas.style.transform =
      "translateX(0)";


    canvas.style.opacity =
      "1";


    /* =========================
       CLEAR
    ========================= */

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    /* =========================
       RENDER
    ========================= */

    currentRenderTask =
      page.render({

        canvasContext:
          context,

        viewport:
          viewport,

        transform:
          devicePixelRatio !== 1
            ? [
                devicePixelRatio,
                0,
                0,
                devicePixelRatio,
                0,
                0
              ]
            : null

      });


    await currentRenderTask.promise;


    currentRenderTask = null;


    /* =========================
       UPDATE
    ========================= */

    pageNum = num;

    updatePageCounter();

    updateButtons();


  } catch (error) {

    if (
      error?.name !==
      "RenderingCancelledException"
    ) {

      console.error(
        "Render Error:",
        error
      );

    }

  }


  rendering = false;


  /* =========================
     QUEUED PAGE
  ========================= */

  if (
    pendingPage !== null
  ) {

    const queuedPage =
      pendingPage;

    pendingPage = null;

    renderPage(
      queuedPage
    );

  }

}


/* =========================
   QUEUE PAGE
========================= */

function queueRenderPage(num) {

  if (!pdfDoc) return;


  if (num < 1) return;


  if (
    num >
    pdfDoc.numPages
  ) return;


  if (rendering) {

    pendingPage = num;

  } else {

    renderPage(num);

  }

}


/* =========================
   NEXT
========================= */

function nextPage() {

  if (!pdfDoc) return;


  if (
    pageNum >=
    pdfDoc.numPages
  ) return;


  turnPage("next");

}


/* =========================
   PREVIOUS
========================= */

function previousPage() {

  if (!pdfDoc) return;


  if (pageNum <= 1) return;


  turnPage("previous");

}


/* =========================
   PAGE TURN
========================= */

function turnPage(direction) {

  if (rendering) return;


  const distance =
    direction === "next"
      ? -80
      : 80;


  canvas.style.transition =
    `
      transform
      0.35s
      cubic-bezier(
        0.22,
        1,
        0.36,
        1
      ),
      opacity
      0.25s ease
    `;


  canvas.style.transform =
    `
      translateX(${distance}px)
    `;


  canvas.style.opacity =
    "0.35";


  setTimeout(
    () => {

      const targetPage =
        direction === "next"
          ? pageNum + 1
          : pageNum - 1;


      queueRenderPage(
        targetPage
      );


      canvas.style.transition =
        "none";


      canvas.style.transform =
        `
          translateX(${
            direction === "next"
              ? 80
              : -80
          }px)
        `;


      canvas.style.opacity =
        "0";


      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            () => {

              canvas.style.transition =
                `
                  transform
                  0.45s
                  cubic-bezier(
                    0.22,
                    1,
                    0.36,
                    1
                  ),
                  opacity
                  0.35s ease
                `;


              canvas.style.transform =
                "translateX(0)";


              canvas.style.opacity =
                "1";

            }
          );

        }
      );

    },
    170
  );

}


/* =========================
   PAGE COUNTER
========================= */

function updatePageCounter() {

  if (!pdfDoc) return;


  const current =
    String(pageNum)
      .padStart(2, "0");


  const total =
    String(pdfDoc.numPages)
      .padStart(2, "0");


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
    pageNum >=
    pdfDoc.numPages;

}


/* =========================
   ERROR
========================= */

function showError(message) {

  loadingElement.classList.add(
    "hidden"
  );


  errorMessageElement.textContent =
    message;


  errorElement.classList.add(
    "visible"
  );

}


/* =========================
   POINTER DOWN
========================= */

pageWrapper.addEventListener(
  "pointerdown",
  (event) => {

    if (!pdfDoc) return;

    if (rendering) return;


    dragging = true;

    startX =
      event.clientX;

    currentX =
      event.clientX;

    dragDistance = 0;


    pageWrapper.classList.add(
      "dragging"
    );


    canvas.classList.add(
      "dragging"
    );


    pageWrapper.setPointerCapture(
      event.pointerId
    );

  }
);


/* =========================
   POINTER MOVE
========================= */

pageWrapper.addEventListener(
  "pointermove",
  (event) => {

    if (!dragging) return;


    currentX =
      event.clientX;


    dragDistance =
      currentX -
      startX;


    /*
      Subtle resistance.
      The page should feel
      physical, but not exaggerated.
    */

    const resistance =
      0.65;


    const movement =
      dragDistance *
      resistance;


    canvas.style.transform =
      `
        translateX(${movement}px)
      `;


    const fade =
      Math.min(
        Math.abs(movement) / 500,
        0.22
      );


    canvas.style.opacity =
      String(
        1 - fade
      );

  }
);


/* =========================
   POINTER UP
========================= */

pageWrapper.addEventListener(
  "pointerup",
  finishDrag
);


pageWrapper.addEventListener(
  "pointercancel",
  finishDrag
);


pageWrapper.addEventListener(
  "lostpointercapture",
  finishDrag
);


/* =========================
   FINISH DRAG
========================= */

function finishDrag() {

  if (!dragging) return;


  dragging = false;


  pageWrapper.classList.remove(
    "dragging"
  );


  canvas.classList.remove(
    "dragging"
  );


  const threshold = 90;


  /* =========================
     NEXT
  ========================= */

  if (
    dragDistance <
    -threshold
  ) {

    if (
      pageNum <
      pdfDoc.numPages
    ) {

      turnPage("next");

      return;

    }

  }


  /* =========================
     PREVIOUS
  ========================= */

  if (
    dragDistance >
    threshold
  ) {

    if (
      pageNum > 1
    ) {

      turnPage("previous");

      return;

    }

  }


  /* =========================
     SNAP BACK
  ========================= */

  canvas.style.transition =
    `
      transform
      0.4s
      cubic-bezier(
        0.22,
        1,
        0.36,
        1
      ),
      opacity
      0.3s ease
    `;


  canvas.style.transform =
    "translateX(0)";


  canvas.style.opacity =
    "1";

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
  closeReader
);


function closeReader() {

  if (
    window.history.length > 1
  ) {

    window.history.back();

  } else {

    window.location.href =
      "index.html";

  }

}


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "ArrowLeft"
    ) {

      previousPage();

    }


    if (
      event.key ===
      "ArrowRight"
    ) {

      nextPage();

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

let resizeTimer = null;

window.addEventListener(
  "resize",
  () => {

    clearTimeout(
      resizeTimer
    );


    resizeTimer =
      setTimeout(
        () => {

          if (pdfDoc) {

            renderPage(
              pageNum
            );

          }

        },
        150
      );

  }
);
