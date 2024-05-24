// API 키 정보 호출
import config from "./config/apikey.js";
// const API_KEY = "3421707b4ccdb97f492e171b71a0d13de1bfe4f8";

// 공통 사용 변수
const API_KEY = config.apiKey;
let CORP_CODE = "00101488"
const YEAR = "2022"
let REPORT_CODE = "11011"; // 11011: 사업보고서 (나머지는 반기 / 분기 보고서)
let corpCode = "";
let corpName = "삼성전자";
let url_dart2 = "";
const companies = [
  { corpCode: "00126380", corpName: "삼성전자" },
  { corpCode: "00164742", corpName: "현대자동차" },
  { corpCode: "00164779", corpName: "에스케이하이닉스" },
  { corpCode: "00401731", corpName: "LG전자" },
  { corpCode: "00258801", corpName: "카카오" },
  { corpCode: "00298270", corpName: "안랩" },
  { corpCode: "00113410", corpName: "CJ대한통운" },
  { corpCode: "00126186", corpName: "삼성에스디에스" },
  { corpCode: "00759294", corpName: "와이솔" },
  { corpCode: "00145880", corpName: "현대제철" },
  { corpCode: "00106368", corpName: "금호석유화학" },
  { corpCode: "00120030", corpName: "지에스건설" },
  { corpCode: "00540429", corpName: "휴림로봇" },
  { corpCode: "00145109", corpName: "유한양행" },
  { corpCode: "00101488", corpName: "경동나비엔" },
];

// class=info 용 변수
const accountNameInfo = ["자산총계", "유동자산", "부채총계", "자본총계", "수익(매출액)", "매출액", "영업수익", "매출원가", "영업비용", "영업이익", "영업이익(손실)", "당기순이익(손실)", "당기순이익"]
let companyFinanceInfo = []
let responseInfo = []

// class=graph 용 변수
let COMPANY_CODE = "00164742";
let url_dart = new URL(
  `https://corsproxy.io/?https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?corp_code=${CORP_CODE}&bsns_year=${YEAR}&reprt_code=${REPORT_CODE}&crtfc_key=${API_KEY}`
);
let data = "";
let writing = document.querySelector("p");
let tabs = document.querySelectorAll(".tab");
let tabSales = document.getElementById("tabSales");
let comp = document.getElementById("mySelect");
let compList = "";
let df = [];


// Info 영역 작업
// index.html에서 넘겨받은 쿼리스트링 파싱 및 dart_url2 설정
document.addEventListener("DOMContentLoaded", function() {
  // URL에서 쿼리 문자열 파싱
  const params = new URLSearchParams(window.location.search);
  corpCode = params.get('corpCode'); // 'corpCode' 쿼리 값 얻기
  let url_dart2 = new URL(`https://corsproxy.io/?https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?corp_code=${corpCode}&bsns_year=${YEAR}&reprt_code=11011&fs_div=OFS&crtfc_key=${API_KEY}`)
  let index = companies.findIndex(obj => obj.corpCode === corpCode);
  corpName = companies[index].corpName;
  getAllCompanyInfo(url_dart2)
});

const getAllCompanyInfo = async (url_dart2) => {
    const response = await fetch(url_dart2);
    const data = await response.json();
    // console.log(url_dart2.toString())
    responseInfo = data.list;
    for (let i=0; i<accountNameInfo.length; i++) {
        let result = responseInfo.filter((value) => {
          try {
            return value.account_nm == accountNameInfo[i]
          } catch (e) {
            console.log(`${value.account_nm} 계정명이 존재하지 않습니다.`) // 예외 메시지 출력
            return false
          }
        })
        if(result.length > 0) {
          companyFinanceInfo.push(result[0])
        }
    }
    // console.log(companyFinanceInfo)
    renderCompanyInfo()
    renderCompanyScorecardInfo()
}

const renderCompanyInfo = () => {
    let companyHTML = `
        <div class="left-company-info col-md-6 col-sm-12">
            <div class="company-code-info">종목코드 ${corpCode}</div>
            <div class="company-name-info">${corpName}</div>
        </div>
        <div class="right-company-info col-md-6 col-sm-12">
            <canvas id="asset-chart-info"></canvas>
        </div>
    `
    document.querySelector(".header .title h1").textContent = `${corpName}`
    document.querySelector(".company-info").innerHTML = companyHTML;
    // 차트 그리기
    const chartOptions = {
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: '자산 추이 (연도별)'
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
                display: false,
              },
            beginAtZero: false,
          },
        },
      };

    const ctxInfo = document.getElementById('asset-chart-info').getContext('2d');
    const chartInfo = new Chart(ctxInfo, {
        // 차트 설정
        type: 'line',
        // 차트 데이터
        data: {
            labels: [`${YEAR-2}`, `${YEAR-1}`, `${YEAR}`],
            datasets: [{
                label: '자산 총계',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [`${Number(companyFinanceInfo[0].bfefrmtrm_amount)}`, `${Number(companyFinanceInfo[0].frmtrm_amount)}`, `${Number(companyFinanceInfo[0].thstrm_amount)}`]
            }]
        },
        options: chartOptions,
    });
}

const renderCompanyScorecardInfo = () => {
    let companyScorecardHTML = `
        <div class="scorecard-title-info">
        재무정보 요약
        <span class="scorecard-year-info">(기준년도: ${companyFinanceInfo[0].bsns_year}년)</>
        </div>
    `
    for (let i=0; i<companyFinanceInfo.length; i++) {
        companyScorecardHTML += `
            <div class="scorecard-item-info col-md-6 col-sm-12">
                <span class="account-name-info">${companyFinanceInfo[i].account_nm}</span>
                <span class="current-amount-info desktop">${(Math.round(Number(companyFinanceInfo[i].thstrm_amount) / 10000)).toLocaleString()}만원</span>
                <span class="current-amount-info mobile">${(Math.round(Number(companyFinanceInfo[i].thstrm_amount) / 100000000)).toLocaleString()}억원</span>
            </div>
        `
    }
    document.querySelector(".company-scorecard-info").innerHTML = companyScorecardHTML;
}

// getAllCompanyInfo()

// Graph 영역 작업
for (let i = 0; i < companies.length; i++) {
  compList += `<option value="${companies[i].corpName}">${companies[i].corpName}</option>`;
}
comp.innerHTML = compList;

tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    toggleActive(tab);
    let activeButton = document.querySelector(".tab.active");
    let textContent = activeButton.textContent.trim();
    console.log(textContent);
    createChart(textContent);
  });
});

const findCorpCodeByName = (name) => {
  const company = companies.find((company) => company.corpName === name);
  return company ? company.corpCode : null;
};

function selectCompany() {
  const selectElement = document.getElementById("mySelect");
  selectElement.addEventListener("change", function () {
    const selectedValue = this.value;
    corpName = selectedValue;
    COMPANY_CODE = findCorpCodeByName(selectedValue);
    url_dart = new URL(
      `https://corsproxy.io/?https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?corp_code=${COMPANY_CODE}&bsns_year=${YEAR}&reprt_code=${REPORT_CODE}&crtfc_key=${API_KEY}`
    );

    createChart("매출액");
    tabs.forEach(function (tab) {
      tab.classList.remove("active");
      tabSales.classList.add("active");
    });

    // 클릭된 요소에 active 클래스를 추가
    element.classList.add("active");

    createChart("매출액");

    // 여기서 script.js로 값을 전달하거나 원하는 작업을 수행할 수 있습니다.
  });
}

async function createChart(accNm) {
  try {
    const result = await getCompanyInfo(); // dataSample은 Promise를 반환해야 합니다.
    console.log(result); // API로부터 받은 데이터를 콘솔에 출력합니다.
    // const corpCode = result.list[0].corp_code;

    // console.log(corpCode); // corp_code 값을 콘솔에 출력합니다.
    // writing.textContent = `회사코드: ${corpCode}`; // writing은 DOM 요소를 가리키는 변수로 가정합니다.

    // find 메서드를 사용하여 조건에 맞는 객체를 찾습니다.
    let selectedItem = result.list.find(
      (item) => item.account_nm === accNm && item.fs_nm === "재무제표"
    );

    // 조건에 맞는 객체에서 'thstrm_amount' 값을 추출합니다.
    let thisTermAmount = selectedItem ? selectedItem.thstrm_amount : null;
    let formerTermAAmount = selectedItem ? selectedItem.frmtrm_amount : null;
    let beforeFormerAmount = selectedItem
      ? selectedItem.bfefrmtrm_amount
      : null;

    df = [
      ["Company", corpName],
      ["2020", parseInt(beforeFormerAmount.replace(/,/g, ""), 10) / 100000000],
      ["2021", parseInt(formerTermAAmount.replace(/,/g, ""), 10) / 100000000],
      ["2022", parseInt(thisTermAmount.replace(/,/g, ""), 10) / 100000000],
    ];
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(drawChart);
  } catch (error) {
    console.error("Error accessing the data:", error);
  }
}

const getCompanyInfo = async () => {
  const response = await fetch(url_dart);
  const data = await response.json();

  return data;
};

function drawChart() {
  const data = google.visualization.arrayToDataTable(df);

  const options = {
    // title: "Revenue",
    vAxis: {
      format: "0,000억", // x 축 단위를 소수점 두 자리로 변경
      gridlines: { count: 2 }, // x 축 그리드 라인 제거
    },
    bar: { groupWidth: "30%" }, // 바 폭 조절
    legend: { position: "bottom" },
    colors: ["#000000"],
  };

  const chart = new google.visualization.ColumnChart(
    document.getElementById("myChart")
  );
  chart.draw(data, options);
}

function toggleActive(element) {
  // 모든 tab 요소에서 active 클래스를 제거
  tabs.forEach(function (tab) {
    tab.classList.remove("active");
  });

  // 클릭된 요소에 active 클래스를 추가
  element.classList.add("active");
}

createChart("매출액");
selectCompany();
