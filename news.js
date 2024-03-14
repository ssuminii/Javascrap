window.onload = function () {
    showContent("realtimeNews");
  };
  
  document.querySelector(".realtime-news").addEventListener("click", function () {
    showContent("realtimeNews");
  });
  document.querySelector(".major-news").addEventListener("click", function () {
    showContent("majorNews");
  });
  document.querySelector(".popular-news").addEventListener("click", function () {
    showContent("popularNews");
  });
  
//   const API_KEY = `a5eea815621a4e13b2b7c866d42d0d8e`;
  const realtimeNewsContent = document.getElementById("realtimeNewsContent");
  const majorNewsContent = document.getElementById("majorNewsContent");
  const popularNewsContent = document.getElementById("popularNewsContent");
  let totalDisplayedArticles = 5;
  
  async function showContent(category) {
    try {
      const apiUrl = "https://noona-api-practice.netlify.app/top-headlines";
      const country = "kr";
      const categoryQuery = getCategoryQuery(category);
      const sortBy = getSortBy(category);
  
      const url = new URL(apiUrl);
      url.searchParams.set("country", country);
      url.searchParams.set("category", categoryQuery);
    //   url.searchParams.set("apiKey", API_KEY);
      url.searchParams.set("sortBy", sortBy);
  
      const response = await fetch(url);
      const data = await response.json();
  
      const shuffledArticles = shuffleArray(data.articles);
      updateContent(category, shuffledArticles);
    } catch (error) {
      console.log("데이터를 불러오지 못 했습니다.", error);
    }
  }
  
  function getCategoryQuery(category) {
    return "business"; // 공통된 값 반환
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  function updateContent(category, articles) {
    const contentElement = getCategoryElement(category);
  
    if (articles && articles.length > 0) {
      const displayedArticles = articles.slice(0, totalDisplayedArticles);
      const articleHTML = displayedArticles
        .map(
          (article) => `
        <div class="row news">
          <div class="news-text col-lg-8">
            <h5><a href="${article.url}" target="_blank">${article.title}</a></h5>
            <p>${article.description || "내용 없음"}</p>
            <div class="news-date">${moment(article.publishedAt)
              .startOf("hour")
              .fromNow()} | ${article.source.name || "소스 없음"}</div>
          </div>
          <div class="col-lg-4">
            <a href="${article.url}" target="_blank">
              <img class="news-img-size" src="${
                article.urlToImage ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqEWgS0uxxEYJ0PsOb2OgwyWvC0Gjp8NUdPw&usqp=CAU"
              }">
            </a>
          </div>
        </div>`
        )
        .join("");
  
      contentElement.innerHTML = articleHTML;
    } else {
      contentElement.innerHTML = "기사를 찾지 못 했습니다.";
    }
  
    showSelectedContent(category);
  }
  
  function showSelectedContent(category) {
    realtimeNewsContent.style.display =
      category === "realtimeNews" ? "block" : "none";
    majorNewsContent.style.display = category === "majorNews" ? "block" : "none";
    popularNewsContent.style.display =
      category === "popularNews" ? "block" : "none";
  }
  
  function getCategoryElement(category) {
    if (category === "realtimeNews") {
      return realtimeNewsContent;
    } else if (category === "majorNews") {
      return majorNewsContent;
    } else if (category === "popularNews") {
      return popularNewsContent;
    }
  }
  
  function getSortBy(category) {
    return category === "realtimeNews"
      ? "publishedAt"
      : category === "majorNews"
      ? "popularity"
      : "views";
  }
  
  const moreButton = document.getElementById("moreButton");
  moreButton.addEventListener("click", loadMoreArticles);
  
  function loadMoreArticles() {
    totalDisplayedArticles += 5;
    const activeCategory = getActiveCategory();
    showContent(activeCategory);
  }
  
  function getActiveCategory() {
    if (realtimeNewsContent.style.display === "block") {
      return "realtimeNews";
    } else if (majorNewsContent.style.display === "block") {
      return "majorNews";
    } else if (popularNewsContent.style.display === "block") {
      return "popularNews";
    }
  }
  