const BASE_URL = "https://movie-list.alphacamp.io";
const INDEX_URL = BASE_URL + "/api/v1/movies/";
const POSTER_URL = BASE_URL + "/posters/";
const MOVIES_PER_PAGE = 12;

const movies = [];
let filteredMovies = [];
const dataPanel = document.querySelector("#data-panel");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const displayModeElement = document.querySelector("#displayMode");
const paginator = document.querySelector("#paginator");

let displayMode = "card";
let currentPage = 1;

// Event : on search submitted or keyup
searchForm.addEventListener("submit", onSearchInputChanged);
searchInput.addEventListener("keyup", onSearchInputChanged);
// Event : clicked display mode
displayModeElement.addEventListener("click", changeDisplayMode);
// Event : show modal or add to favorite
dataPanel.addEventListener("click", onPanelClicked);
// Event : clicked paginator
paginator.addEventListener("click", onPaginatorClicked);

// render primal page
axios.get(INDEX_URL).then((response) => {
  movies.push(...response.data.results);
  checkModeAndRender(displayMode);
  renderPaginator(movies.length);
});

// Functions
function checkModeAndRender(displayMode) {
  if (displayMode === "card") {
    renderMovieByCard(getMoviesByPage(currentPage));
  } else if (displayMode === "list") {
    renderMovieByList(getMoviesByPage(currentPage));
  }
}

function getMoviesByPage(page) {
  //get movies from raw data or filtered data by keyword
  const getMovies = searchInput.value.trim().toLowerCase().length
    ? filteredMovies
    : movies;
  const startIndex = (page - 1) * MOVIES_PER_PAGE;
  return getMovies.slice(startIndex, startIndex + MOVIES_PER_PAGE);
}

function renderMovieByCard(data) {
  let dataHTML = ``;
  data.forEach((item) => {
    let movieTitle =
      item.title.length > 20 ? item.title.slice(0, 21) + "..." : item.title;
    dataHTML += `
    <div class="col-sm-3 mb-2">
        <div class="card">
          <img
            src="${POSTER_URL + item.image}"
            class="card-img-top" alt="Movie Poster">
          <div class="card-body d-flex align-items-center" style="min-height:80px">
            <h5 class="card-text">${item.title}</h5>
          </div>
          <div class="card-footer">
            <button type="button" class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
              data-bs-target="#movie-modal" data-id="${item.id}">More</button>
            <button type="button" class="btn btn-info btn-add-favorite" data-id="${
              item.id
            }">+</button>
          </div>
        </div>
    </div>
    `;
  });
  dataPanel.innerHTML = dataHTML;
}

function renderMovieByList(data) {
  let dataHTML = ``;
  dataHTML += `<ul class="list-group" id="data-list-group">`;
  data.forEach((item) => {
    dataHTML += `
    <li class="list-group-item d-sm-flex justify-content-between align-items-center " aria-current="true">${item.title}
      <div class="btn-wrapper">
        <button type="button" class="btn btn-primary btn-show-movie me-2" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
        <button type="button" class="btn btn-info btn-add-favorite " data-id="${item.id}">+</button>
      </div>
    </li>
  `;
  });
  dataHTML += `</ul>`;
  dataPanel.innerHTML = dataHTML;
}

function renderPaginator(amount) {
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE);
  let rawHTML = ``;
  for (let i = 1; i <= numberOfPages; i++) {
    rawHTML += `<li class="page-item"><a class="page-link" data-page="${i}"href="#">${i}</a></li>`;
  }
  paginator.innerHTML = rawHTML;
  if (numberOfPages >= 1) {
    const firstPage = document.querySelector("#paginator :nth-child(1)");
    firstPage.classList.add("active");
  }
}

function showMovieModal(id) {
  const modalTitle = document.querySelector("#movie-modal-title");
  const modalImage = document.querySelector("#movie-modal-img");
  const modalDate = document.querySelector("#movie-modal-date");
  const modalDescription = document.querySelector("#movie-modal-description");
  axios.get(INDEX_URL + id).then((response) => {
    let movieData = response.data.results;
    modalTitle.textContent = movieData.title;
    modalImage.innerHTML = `
      <img src="${POSTER_URL + movieData.image}" 
      alt="movie-poster" 
      class="img-fluid">`;
    modalDate.innerText = `release date : ${movieData.release_date}`;
    modalDescription.innerText = movieData.description;
  });
}

function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem("favoriteMovies")) || [];
  const movie = movies.find((movie) => movie.id === id);
  if (list.some((movie) => movie.id === id)) {
    alert("電影已加入");
  } else {
    list.push(movie);
    localStorage.setItem("favoriteMovies", JSON.stringify(list));
  }
}

// Event Functions
function changeDisplayMode(event) {
  if (event.target.tagName !== "I") return;
  displayMode = event.target.dataset.mode;
  // toggle active color
  const displayModeElements = document.querySelectorAll("#displayMode li");
  displayModeElements.forEach((item) => {
    if (item.matches(".mode-active")) {
      item.classList.remove("mode-active");
    }
  });
  event.target.closest(".list-group-item").classList.add("mode-active");

  checkModeAndRender(displayMode);
}

function onPaginatorClicked(event) {
  if (event.target.tagName !== "A") return;
  const paginators = document.querySelectorAll("#paginator a");
  currentPage = Number(event.target.dataset.page);
  //toggle active color
  paginators.forEach((item) => {
    if (item.parentElement.matches(".active")) {
      item.parentElement.classList.remove("active");
    } else if (Number(item.dataset.page) === currentPage) {
      item.parentElement.classList.add("active");
    }
  });
  checkModeAndRender(displayMode);
}

function onPanelClicked(event) {
  if (event.target.matches(".btn-show-movie")) {
    showMovieModal(Number(event.target.dataset.id));
  } else if (event.target.matches(".btn-add-favorite")) {
    addToFavorite(Number(event.target.dataset.id));
  }
}

function onSearchInputChanged(event) {
  // prevent submitted default and reset current page
  event.preventDefault();
  currentPage = 1;

  const keyword = searchInput.value.trim().toLowerCase();
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  );
  renderPaginator(filteredMovies.length);
  checkModeAndRender(displayMode);

  // alert when result empty
  if (filteredMovies.length === 0) {
    dataPanel.innerHTML = `
    <div class="alert alert-danger" role="alert">
      您輸入的關鍵字：${keyword} 沒有符合條件的電影
    </div>`;
  }
}
