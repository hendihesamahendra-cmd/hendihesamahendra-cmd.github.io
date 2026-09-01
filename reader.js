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

const bookStage =
  document.getElementById(
    "book-stage"
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

let isDragging = false;

let dragStartX = 0;

let dragCurrentX = 0;

let dragDistance = 0;

let dragDirection = 0;


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
       DISPLAY SCALE
    ========================= */

    const scale = 1.8;

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
       HIGH RESOLUTION CANVAS
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

    const nextPageNum =
      pendingPage;

    pendingPage = null;

    renderPage(
      nextPageNum
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
   PREVIOUS PAGE
========================= */

function previousPage() {

  if (!pdfDoc) return;

  if (pageNum <= 1) return;

  animatePageTurn(
    "previous"
  );

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

  animatePageTurn(
    "next"
  );

}


/* =========================
   PAGE TURN ANIMATION
========================= */

function animatePageTurn(
  direction
) {

  if (rendering) return;


  const distance =
    direction === "next"
      ? -120
      : 120;

  const rotation =
    direction === "next"
      ? -4
      : 4;


  canvas.style.transform =
    `
      translateX(${distance}px)
      rotateY(${rotation}deg)
    `;


  canvas.style.opacity =
    "0.15";


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
              ? 120
              : -120
          }px)
          rotateY(${
            direction === "next"
              ? 4
              : -4
          }deg)
        `;

      canvas.style.opacity =
        "0";


      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            () => {

              canvas.style.transition =
                "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease";

              canvas.style.transform =
                `
                  translateX(0)
                  rotateY(0deg)
                `;

              canvas.style.opacity =
                "1";

            }
          );

        }
      );

    },
    180
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
   DRAG START
========================= */

bookStage.addEventListener(
  "pointerdown",
  (event) => {

    if (!pdfDoc) return;

    if (rendering) return;


    isDragging = true;

    dragStartX =
      event.clientX;

    dragCurrentX =
      event.clientX;

    dragDistance = 0;

    dragDirection = 0;


    bookStage.classList.add(
      "dragging"
    );

    canvas.classList.add(
      "dragging"
    );


    bookStage.setPointerCapture(
      event.pointerId
    );

  }
);


/* =========================
   DRAG MOVE
========================= */

bookStage.addEventListener(
  "pointermove",
  (event) => {

    if (!isDragging) return;


    dragCurrentX =
      event.clientX;


    dragDistance =
      dragCurrentX -
      dragStartX;


    dragDirection =
      dragDistance < 0
        ? 1
        : -1;


    /* =========================
       RESISTANCE
    ========================= */

    const resistance =
      Math.abs(dragDistance) >
      100
        ? 0.55
        : 0.75;


    const visualDistance =
      dragDistance *
      resistance;


    const rotation =
      visualDistance /
      35;


    canvas.style.transform =
      `
        translateX(${visualDistance}px)
        rotateY(${rotation}deg)
      `;


    const opacity =
      Math.max(
        0.72,
        1 -
        Math.abs(
          visualDistance
        ) / 600
      );


    canvas.style.opacity =
      opacity;

  }
);


/* =========================
   DRAG END
========================= */

bookStage.addEventListener(
  "pointerup",
  finishDrag
);

bookStage.addEventListener(
  "pointercancel",
  finishDrag
);

bookStage.addEventListener(
  "lostpointercapture",
  finishDrag
);


function finishDrag() {

  if (!isDragging) return;


  isDragging = false;


  bookStage.classList.remove(
    "dragging"
  );

  canvas.classList.remove(
    "dragging"
  );


  const threshold = 110;


  /* =========================
     TURN PAGE
  ========================= */

  if (
    Math.abs(dragDistance) >=
    threshold
  ) {

    if (
      dragDistance < 0 &&
      pageNum < pdfDoc.numPages
    ) {

      animatePageTurn(
        "next"
      );

      return;

    }


    if (
      dragDistance > 0 &&
      pageNum > 1
    ) {

      animatePageTurn(
        "previous"
      );

      return;

    }

  }


  /* =========================
     RETURN
  ========================= */

  canvas.style.transition =
    "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease";

  canvas.style.transform =
    `
      translateX(0)
      rotateY(0deg)
    `;

  canvas.style.opacity =
    "1";

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
