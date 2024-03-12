import config from "./config/apikey.js";
const API_KEY_STOCK = config.API_KEY;
const API_KEY = config.apiKey;

let stocksTotalList = [];
let stockPrices = [];
let stockItems = [];

const stockTotalUrl = new URL(
  `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${API_KEY_STOCK}&resultType=json&pageNo=1&numOfRows=50`
);

const getStock = async (urlStr) => {
  const url = new URL(urlStr);
  const response = await fetch(url);
  const data = await response.json();
  return data.response.body.items.item;
};

// 종목명 name 받아와서 url 생성
function setStockGraphUrl(name) {
  return `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${API_KEY_STOCK}&resultType=json&pageNo=1&numOfRows=50&beginBasDt=20240101&itmsNm=${name}`;
}

// 주식 Render
const stockRender = async () => {
  let stocksHTML = stocksTotalList.map(async (stocks) => {
    const date = `${stocks.basDt}`;
    const formattedDate = `${date.substr(4, 2)}.${date.substr(6, 2)}`;

    let fltRtColor = "";
    if (stocks.fltRt > 0) {
      fltRtColor = "red";
      stocks.fltRt = `+${stocks.fltRt}`;
    } else if (stocks.fltRt == 0) {
      fltRtColor = "gray";
    }

    const itemName = stocks.itmsNm;
    const stockGraphUrl = setStockGraphUrl(itemName);

    stockItems = await getStock(stockGraphUrl);
    let timestampList = [];
    let priceList = [];
    stockItems.map((s) => {
      timestampList.push(`${s.basDt}`);
      priceList.push(Number(`${s.mkp}`));
    });

    stockPrices.push({ itemName, priceList, timestampList });

    return `
      <a href=#>
        <div class="stock-info">
          <div class="stock-market">
            <strong>${stocks.mrktCtg}</strong>
          </div>
          <div class="stock-title">
            <span>${itemName}</span>
          </div>
          <div class="stock-price">
            <h1>${Number(stocks.mrktTotAmt).toLocaleString("ko-KR")}</h1>
          </div>
          <div class="fluctuation-rate">
            <span style="color: ${fltRtColor};">${stocks.fltRt}%</span>
          </div>
          <div class="stock-date">
            ${formattedDate}
          </div>
        </div>
        <div id="stock-graph-${stocks.itmsNm.replace(
          /\s/g,
          ""
        )}" class="stock-graph">
          <canvas id="stock-chart-${stocks.itmsNm.replace(
            /\s/g,
            ""
          )}" class="stock-chart"></canvas>
        </div>
      </a>`;
  });

  stocksHTML = await Promise.all(stocksHTML);
  document.getElementById("carousel").innerHTML = stocksHTML.join("");

  // 주식 그래프
  stockPrices.forEach((stock) => {
    const chartData = {
      labels: stock.timestampList,
      datasets: [
        {
          label: "stock-price",
          data: stock.priceList,
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    };

    const chartOptions = {
      plugins: {
        legend: {
          display: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            display: false,
          },
        },
        y: {
          beginAtZero: false,
        },
      },
      tooltips: {
        mode: "nearest",
        intersect: true,
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
    };

    const ctx = document
      .getElementById(`stock-chart-${stock.itemName.replace(/\s/g, "")}`)
      .getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: chartData,
      options: chartOptions,
    });
  });
};

const fetchData = async () => {
  stocksTotalList = await getStock(stockTotalUrl);
  stockRender();
};

fetchData();

const CORP_CODE = [
  "00126380", //삼성전자(주)
  "00164742", //현대자동차(주)
  "00164779", //에스케이하이닉스(주)
  "00401731", //LG전자
  "00258801", //(주)카카오
  "00298270", //(주)안랩
  "00113410", //CJ대한통운
  "00126186", //삼성에스디에스(주)
  "00759294", //(주)와이솔
  "00145880", //현대제철(주)
  "00106368", //금호석유화학(주)
  "00120030", //지에스건설(주)
  "00540429", //휴림로봇(주)
  "00145109", //(주)유한양행
  "00101488", //(주)경동나비엔
];
const YEAR = "2022";
const REPORT_CODE = "11011"; // 11011: 사업보고서 (나머지는 반기 / 분기 보고서)

const CORS_LINK = "https://corsproxy.io/?";
// const CORS_LINK = "https://cors-anywhere.herokuapp.com/";
const CORP_NAME_API_LINK = "https://opendart.fss.or.kr/api/company.json";
const CORP_INFO_API_LINK = "https://opendart.fss.or.kr/api/fnlttSinglAcnt.json";

let corpInfos = [];
let favoriteCorps = [];

const likeBtn = document.querySelector(".favorite-button");
let isLiked = false;

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("corpSearch"); // 검색창 입력 필드
  const searchBtn = document.getElementById("searchBtn"); // 검색 버튼

  // 검색 실행 함수
  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase(); // 검색어 가져오기
    let found = false; // 기업 찾았는지 여부

    // '인기 기업' 목록 검색
    const corps = document.querySelectorAll(".p-listContent .corp");
    corps.forEach((corp) => {
      const corpName = corp
        .querySelector(".corpName")
        .textContent.trim()
        .toLowerCase(); // 기업명 가져오기
      if (searchTerm && corpName.includes(searchTerm)) {
        found = true; // 기업 찾음
        corp.style.display = ""; // 검색된 기업 보여주기
      } else {
        corp.style.display = searchTerm ? "none" : ""; // 검색어가 있으면 숨기기, 없으면 보여주기
      }
    });

    // 검색된 기업이 없으면 경고창 표시, 검색어가 있는 경우에만
    if (!found && searchTerm) {
      alert("검색된 기업이 없습니다.");
      // 모든 기업을 다시 보여주기
      corps.forEach((corp) => (corp.style.display = ""));
    }

    // 검색창의 내용 지우기
    searchInput.value = "";
  }

  // 검색 버튼 클릭 이벤트 리스너 추가
  searchBtn.addEventListener("click", function () {
    performSearch();
  });

  // 검색창에서 Enter 키 이벤트 리스너 추가
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      // Enter 키를 누르면
      performSearch();
      event.preventDefault(); // 폼 제출 방지
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // '.p-listContent' 및 '.f-listContent' 내의 모든 클릭 이벤트를 위임하여 처리
  document
    .querySelector(".container")
    .addEventListener("click", function (event) {
      // 클릭된 요소가 'favorite-button'인 경우에만 로직 실행
      if (event.target.classList.contains("favorite-button")) {
        event.preventDefault(); // 기본 동작 방지
        const parentCorp = event.target.closest(".corp"); // 현재 기업 요소
        const corpId = parentCorp.getAttribute("data-corp-id"); // 현재 기업의 데이터 ID 속성

        if (parentCorp.classList.contains("p-corp")) {
          // '인기 기업'에서 클릭된 경우
          const existingCorp = document.querySelector(
            `.f-listContent .corp[data-corp-id="${corpId}"]`
          );
          if (!existingCorp) {
            // '관심 기업' 목록에 없으면 복사 및 추가
            const corpClone = parentCorp.cloneNode(true);
            corpClone.querySelector(".favorite-button").src = "asset/like.png";
            corpClone.classList.replace("p-corp", "f-corp"); // 클래스 변경
            document.querySelector(".f-listContent").appendChild(corpClone);
          } else {
            // '관심 기업' 목록에서 이미 존재하면 삭제
            existingCorp.remove();
          }
        } else if (parentCorp.classList.contains("f-corp")) {
          // '관심 기업'에서 클릭된 경우
          parentCorp.remove(); // 해당 기업 삭제
        }

        // '인기 기업' 목록의 버튼 이미지 상태 업데이트
        updateFavoriteButtonState();
      }
    });

  // '인기 기업' 목록의 모든 'favorite-button'에 대한 상태 업데이트 함수
  function updateFavoriteButtonState() {
    document.querySelectorAll(".p-listContent .corp").forEach((corp) => {
      const corpId = corp.getAttribute("data-corp-id");
      const existingCorp = document.querySelector(
        `.f-listContent .corp[data-corp-id="${corpId}"]`
      );
      const likeButton = corp.querySelector(".favorite-button");
      if (likeButton) {
        likeButton.src = existingCorp ? "asset/like.png" : "asset/no-like.png";
      }
    });
  }
});

const popularGetCorpInfo = async () => {
  for (let corp of CORP_CODE) {
    let corpName_url = new URL(
      `${CORS_LINK}${CORP_NAME_API_LINK}?crtfc_key=${API_KEY}&corp_code=${corp}`
    );
    let corpInfo_url = new URL(
      `${CORS_LINK}${CORP_INFO_API_LINK}?crtfc_key=${API_KEY}&corp_code=${corp}&bsns_year=${YEAR}&reprt_code=${REPORT_CODE}`
    );
    const responseCorpName = await fetch(corpName_url);
    const responseCorpInfo = await fetch(corpInfo_url);
    const dataCorpName = await responseCorpName.json();
    const dataCorpInfo = await responseCorpInfo.json();

    // console.log(dataCorpName);
    // console.log(dataCorpInfo);

    if (dataCorpInfo && dataCorpInfo.list && dataCorpInfo.list.length > 0) {
      let corpInfo = {
        id: dataCorpName.corp_code,
        stockCode: dataCorpName.stock_code,
        corpName: dataCorpName.corp_name,
        sales: parseFloat(
          dataCorpInfo.list[23]?.thstrm_amount.replace(/,/g, "") || "0"
        ),
        assetThisYear: parseFloat(
          dataCorpInfo.list[23]?.thstrm_amount.replaceAll(",", "") || "0"
        ),
        assetLastYear: parseFloat(
          dataCorpInfo.list[23]?.frmtrm_amount.replace(/,/g, "") || "0"
        ),
        asset: parseFloat(
          dataCorpInfo.list[16]?.thstrm_amount.replace(/,/g, "") || "0"
        ),
        netIncome: parseFloat(
          dataCorpInfo.list[26]?.thstrm_amount.replace(/,/g, "") || "0"
        ),
      };
      corpInfos.push(corpInfo);
    } else {
      console.log(`Data for corporation ${corp} is incomplete or missing.`);
    }
    render();
  }
};

popularGetCorpInfo();

const render = () => {
  let result = "";
  for (let info of corpInfos) {
    if (
      ((info.assetThisYear - info.assetLastYear) / info.assetLastYear) * 100 >=
      0
    ) {
      result += `<a class="p-corp corp" data-corp-id="${
        info.corpName
      }" href="detail.html?corpCode=${info.id}">
                  <div class="p-corpName corpName">
                      <span>
                          <img class="favorite-button" src="asset/no-like.png">
                      </span>
                      ${info.corpName}
                  </div>
                  <div class="p-sales sales">
                  ${expressJoEok(info.sales)}
              </div>
              <div class="p-salesIncrease salesIncrease">
                  <div class="plus">${Math.ceil(
                    ((info.assetThisYear - info.assetLastYear) /
                      info.assetLastYear) *
                      100
                  )}%</div>
              </div>
              <div class="p-asset asset">
              ${expressJoEok(info.asset)}
              </div>
              <div class="p-netIncome netIncome">
              ${expressJoEok(info.netIncome)}
              </div>
              </a>`;
    } else {
      result += `<a class="p-corp corp" data-corp-id="${
        info.corpName
      }" href="detail.html?corpCode=${info.id}">
                  <div class="p-corpName corpName">
                      <span>
                          <img class="favorite-button" src="asset/no-like.png">
                      </span>
                      ${info.corpName}
                  </div>
                  <div class="p-sales sales">
                  ${expressJoEok(info.sales)}
              </div>
              <div class="p-salesIncrease salesIncrease">
                  <div class="minus">
                     ${Math.ceil(
                       ((info.assetThisYear - info.assetLastYear) /
                         info.assetLastYear) *
                         100
                     )}%</div>
              </div>
              <div class="p-asset asset">
                  ${expressJoEok(info.asset)}
              </div>
              <div class="p-netIncome netIncome">
                  ${expressJoEok(info.netIncome)}
              </div>
              </a>`;
    }
  }

  document.querySelector(".p-listContent").innerHTML = result;
};

function expressJoEok(amount) {
  // 음수인지 확인
  let isNegative = amount < 0;
  // 절대값을 사용하여 계산
  let absAmount = Math.abs(amount);
  // 조 단위로 변환
  let amountInJo = Math.floor(absAmount / 1000000000000); // 조 단위를 구함
  // 억 단위로 변환 (1조를 넘는 부분만 계산)
  let amountInEok = Math.floor((absAmount % 1000000000000) / 100000000); // 억 단위를 구하고 정수로 변환
  // 숫자에 콤마(,) 추가
  let amountInEokWithComma = amountInEok.toLocaleString("ko-KR");

  // 음수인 경우 처리
  let result = "";
  if (isNegative) {
    result = "-";
  }

  if (amountInJo === 0) return result + `${amountInEokWithComma}억원`;
  else return result + `${amountInJo}조 ${amountInEokWithComma}억원`;
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("search-show").addEventListener("click", () => {
    const searchArea = document.querySelector(".search-container");
    if (searchArea.style.display === "flex") {
      searchArea.style.display = "none";
    } else {
      searchArea.style.display = "flex";
    }
  });
});

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
    url.searchParams.set("apiKey", API_KEY);
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
