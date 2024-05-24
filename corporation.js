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
const CORP_NAME_API_LINK = "https://opendart.fss.or.kr/api/company.json";
const CORP_INFO_API_LINK = "https://opendart.fss.or.kr/api/fnlttSinglAcnt.json";

// 로컬 스토리지에서 기존의 corpInfos 데이터를 로드
// let corpInfos = JSON.parse(localStorage.getItem("corpInfos")) || [];
let corpInfos = [];

const popularGetCorpInfo = async () => {
  for (let corp of CORP_CODE) {
    const corpName_url = new URL(
      `${CORS_LINK}${CORP_NAME_API_LINK}?crtfc_key=${API_KEY}&corp_code=${corp}`
    ); //"기업명" 값을 위한 API호출 URL
    const corpInfo_url = new URL(
      `${CORS_LINK}${CORP_INFO_API_LINK}?crtfc_key=${API_KEY}&corp_code=${corp}&bsns_year=${YEAR}&reprt_code=${REPORT_CODE}`
    ); //"매출, 매출증감율, 자산, 당기순이익" 값을 위한 API호출 URL
    const responseCorpName = await fetch(corpName_url);
    const responseCorpInfo = await fetch(corpInfo_url);
    const dataCorpName = await responseCorpName.json();
    const dataCorpInfo = await responseCorpInfo.json();

    if (dataCorpInfo && dataCorpInfo.list && dataCorpInfo.list.length > 0) {
      //기업들의 정보를 보여주는 객체
      let corpInfo = {
        id: dataCorpName.corp_code, //기업 고유번호
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
  // 로컬 스토리지에 corpInfos 데이터를 저장
  // localStorage.setItem("corpInfos", JSON.stringify(corpInfos));
};

// 렌더링 함수
const render = () => {
  let renderContents = "";
  for (let info of corpInfos) {
    if (
      ((info.assetThisYear - info.assetLastYear) / info.assetLastYear) * 100 >=
      0
    ) {
      renderContents += `<a class="corp" data-corp-id="${
        info.corpName
      }" href="corporationDetail.html?corpCode=${info.id}">
                  <div class="p-corpName corpName">
                          <img class="favorite-button" src="corp-page-assets/no-like.png">
                      ${info.corpName}
                  </div>
                  <div class="p-sales sales">
                  ${expressHundredMillion(info.sales)}
              </div>
              <div class="p-salesIncrease salesIncrease">
                  <div class="plus">${Math.ceil(
                    ((info.assetThisYear - info.assetLastYear) /
                      info.assetLastYear) *
                      100
                  )}%</div>
              </div>
              <div class="p-asset asset">
              ${expressHundredMillion(info.asset)}
              </div>
              <div class="p-netIncome netIncome">
              ${expressHundredMillion(info.netIncome)}
              </div>
              </a>`;
    } else {
      renderContents += `<a class="corp" data-corp-id="${
        info.corpName
      }" href="corporationDetail.html?corpCode=${info.id}">
                  <div class="p-corpName corpName">
                      <img class="favorite-button" src="corp-page-assets/no-like.png">
                      ${info.corpName}
                  </div>
                  <div class="p-sales sales">
                  ${expressHundredMillion(info.sales)}
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
                  ${expressHundredMillion(info.asset)}
              </div>
              <div class="p-netIncome netIncome">
                  ${expressHundredMillion(info.netIncome)}
              </div>
              </a>`;
    }
  }
  document.querySelector(".p-listContent").innerHTML = renderContents;
};

popularGetCorpInfo();

// O조 O,OOO억 단위 표현 함수
const expressHundredMillion = (amount) => {
  // 음수인지 확인
  let isNegative = amount < 0;
  // 절대값을 사용하여 계산
  let absAmount = Math.abs(amount);
  // 조 단위로 변환
  let amountInJo = Math.floor(absAmount / 1000000000000); // 조 단위를 구함
  // 억 단위로 변환
  let amountInEok = Math.floor((absAmount % 1000000000000) / 100000000); // 억 단위를 구하고 정수로 변환
  // 숫자에 콤마(,) 추가
  let amountInEokWithComma = amountInEok.toLocaleString("ko-KR");

  // 음수인 경우 (-) 추가
  let result = "";
  if (isNegative) {
    result = "-";
  }
  if (amountInJo === 0) return result + `${amountInEokWithComma}억원`;
  else return result + `${amountInJo}조 ${amountInEokWithComma}억원`;
};

// >>>>>>>>>>>>> 1)돋보기 토글 기능 / 2)인기기업 > 관심기업 기능
document.addEventListener("DOMContentLoaded", () => {
  // 돋보기 이미지 클릭 시 검색 창 보여주는 토글 함수
  document.querySelector("#search-show").addEventListener("click", () => {
    const searchArea = document.querySelector(".search-container");
    if (searchArea.style.display === "flex") {
      searchArea.style.display = "";
    } else {
      searchArea.style.display = "flex";
    }
  });

  // .container 클래스 내의 모든 클릭 이벤트를 위임하여 처리
  document.querySelector("body").addEventListener("click", (event) => {
    // 클릭된 요소가 'favorite-button'인 경우에만 로직 실행
    if (event.target.classList.contains("favorite-button")) {
      event.preventDefault(); // 기본 동작 방지
      toggleFavorite(event.target);
    }
  });
  // 좋아요 버튼 토글 함수
  const toggleFavorite = (favoriteButton) => {
    const parentCorp = favoriteButton.closest(".corp"); // 현재 기업 요소
    const corpId = parentCorp.getAttribute("data-corp-id"); // 현재 기업의 데이터 ID 속성
    let existingCorp = document.querySelector(
      `.f-listContent .corp[data-corp-id="${corpId}"]`
    );

    if (existingCorp) {
      // '관심 기업' 목록에서 이미 존재하면 삭제
      existingCorp.remove();
    } else {
      // '관심 기업' 목록에 없으면 복사 및 추가
      const cloneCorp = parentCorp.cloneNode(true);
      cloneCorp.querySelector(".favorite-button").src = "corp-page-assets/like.png";
      document.querySelector(".f-listContent").append(cloneCorp);
    }
    // '인기 기업' 목록의 버튼 이미지 상태 업데이트
    updateFavoriteLikeBtn();
  };

  // '인기 기업' 목록의 모든 'favorite-button'에 대한 상태 업데이트 함수
  const updateFavoriteLikeBtn = () => {
    document.querySelectorAll(".p-listContent .corp").forEach((corp) => {
      const corpId = corp.getAttribute("data-corp-id");
      const isFavorited = document.querySelector(
        `.f-listContent .corp[data-corp-id="${corpId}"]`
      );
      let likeBtn = corp.querySelector(".favorite-button");
      likeBtn.src = isFavorited ? "corp-page-assets/like.png" : "corp-page-assets/no-like.png";
    });
  };
});

// >>>>>>>>>>>>> 검색기능
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("corpSearch"); // 검색창 입력 필드
  const searchBtn = document.getElementById("searchBtn"); // 검색 버튼

  // 검색 버튼 클릭 이벤트 리스너 추가
  searchBtn.addEventListener("click", performSearch);
  // 검색창에서 Enter 키 이벤트 리스너 추가
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // 폼 제출 방지
      performSearch(); // Enter 키를 누르면
    }
  });

  // 검색 실행 함수
  function performSearch() {
    const searchCorp = searchInput.value.toLowerCase().trim(); // 검색어 가져오기
    const corps = document.querySelectorAll(".p-listContent .corp");

    if (!searchCorp) {
      // 검색어가 없으면 모든 기업을 보여준다.
      corps.forEach((corp) => (corp.style.display = ""));
      return; // 검색어가 없으면 여기서 함수 종료
    }

    let isFoundCorp = false; // 기업 찾았는지 여부 변수

    // '인기 기업' 목록 검색
    corps.forEach((corp) => {
      const corpName = corp
        .querySelector(".corpName")
        .innerText.toLowerCase()
        .trim();
      if (corpName.includes(searchCorp)) {
        corp.style.display = ""; // 검색된 기업 보여주기
        isFoundCorp = true;
      } else {
        corp.style.display = "none"; // 검색어와 일치하지 않으면 숨기기
      }
    });

    // 검색된 기업이 없으면 경고창 표시
    if (!isFoundCorp) {
      alert("검색된 기업이 없습니다.");
    }

    searchInput.value = ""; // 검색창의 내용 지우기
  }
});
