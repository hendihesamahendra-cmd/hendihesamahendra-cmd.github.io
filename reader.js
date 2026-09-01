import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


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


const params = new URLSearchParams(window.location.search);
const bookKey = params.get("book");

const book = books[bookKey];


const canvas = document.getElementById("pdf-canvas");
const context = canvas.getContext("2d");

const titleElement = document.getElementById("book-title");
const pageNumberElement = document.getElementById("page-number");
const totalPagesElement = document.getElementById("total-pages");
const loadingElement = document.getElementById("loading");
const errorElement = document.getElementById("error");

const previousButton = document.getElementById("prev");
const nextButton = document.getElementById("next");


let pdfDoc = null;
let pageNum = 1;
let rendering = false;
let pendingPage = null;


if (!book) {

    loadingElement.style.display = "none";
    errorElement.textContent = "Book not found.";
    errorElement.style.display = "block";

} else {

    titleElement.textContent = book.title;

    loadPDF(book.pdf);

}


async function loadPDF(url) {

    try {

        const loadingTask = pdfjsLib.getDocument(url);

        pdfDoc = await loadingTask.promise;

        totalPagesElement.textContent = pdfDoc.numPages;

        loadingElement.style.display = "none";

        renderPage(pageNum);

    } catch (error) {

        console.error(error);

        loadingElement.style.display = "none";

        errorElement.textContent =
            "Unable to load this book.";

        errorElement.style.display = "block";

    }

}


async function renderPage(num) {

    rendering = true;

    const page = await pdfDoc.getPage(num);

    const viewport = page.getViewport({
        scale: 1.5
    });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    pageNumberElement.textContent = num;

    rendering = false;

    if (pendingPage !== null) {

        renderPage(pendingPage);

        pendingPage = null;

    }

}


function queueRenderPage(num) {

    if (rendering) {

        pendingPage = num;

    } else {

        renderPage(num);

    }

}


function previousPage() {

    if (pageNum <= 1) return;

    pageNum--;

    queueRenderPage(pageNum);

}


function nextPage() {

    if (!pdfDoc) return;

    if (pageNum >= pdfDoc.numPages) return;

    pageNum++;

    queueRenderPage(pageNum);

}


previousButton.addEventListener(
    "click",
    previousPage
);

nextButton.addEventListener(
    "click",
    nextPage
);


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

            window.history.back();

        }

    }
);
