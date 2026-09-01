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

const bookArea =
  document.getElementById(
    "book-area"
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
       AVAILABLE SPACE
    ========================= */

    const areaWidth =
      bookArea.clientWidth;

    const areaHeight =
      bookArea.clientHeight;


    const isMobile =
      window.innerWidth <= 700;


    /*
      Safe margins.

      Desktop:
      leave enough space for
      navigation arrows.

      Mobile:
      preserve the current
      comfortable layout.
    */

    const horizontalMargin =
      isMobile
        ? 32
        : 150;

    const verticalMargin =
      isMobile
        ? 36
        : 50;


    const availableWidth =
      Math.max(
        100,
        areaWidth -
        horizontalMargin
      );


    const availableHeight =
      Math.max(
        100,
        areaHeight -
        verticalMargin
      );


    /* =========================
       ORIGINAL PDF SIZE
    ========================= */

    const baseViewport =
      page.getViewport({
        scale: 1
      });


    /* =========================
       FIT WIDTH
    ========================= */

    const widthScale =
      availableWidth /
      baseViewport.width;


    /* =========================
       FIT HEIGHT
    ========================= */

    const heightScale =
      availableHeight /
      baseViewport.height;


    /*
      Choose whichever is smaller.

      This guarantees the entire
      page fits inside the reader.
    */

    let scale =
      Math.min(
        widthScale,
        heightScale
      );


    /* =========================
       SCALE LIMITS
    ========================= */

    /*
      Prevent extremely tiny
      pages on unusual screens.
    */

    scale =
      Math.max(
        scale,
        0.5
      );


    /*
      Prevent unnecessarily huge
      rendering on very large screens.
    */

    scale =
      Math.min(
        scale,
        2
      );


    /* =========================
       VIEWPORT
    ========================= */

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
       CANVAS INTERNAL SIZE
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
       CANVAS VISUAL SIZE
    ========================= */

    canvas.style.width =
      `${viewport.width}px`;


    canvas.style.height =
      `${viewport.height}px`;


    /* =========================
       RESET
    ========================= */

    canvas.style.transform =
      "translateX(0)";

    canvas.style.opacity =
      "1";


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
   NEXT PAGE
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
   PREVIOUS PAGE
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
      ? -70
      : 70;


  canvas.style.transition =
    `
      transform
      0.32s
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
    "0.45";


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
              ? 70
              : -70
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
    160
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
   DRAG START
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
   DRAG MOVE
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


    const resistance =
      0.6;


    const movement =
      dragDistance *
      resistance;


    canvas.style.transform =
      `
        translateX(${movement}px)
      `;


    const fade =
      Math.min(
        Math.abs(movement) /
        500,
        0.16
      );


    canvas.style.opacity =
      String(
        1 - fade
      );

  }
);


/* =========================
   DRAG END
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
