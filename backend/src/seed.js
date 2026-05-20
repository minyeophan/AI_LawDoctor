import mongoose from "mongoose";
import dotenv from "dotenv";
import Form from "./schemas/form_db.js";

dotenv.config();

const klacForms = [
    {
        form_name: "법무부 주택임대차 표준계약서(한글)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2026%2f03%2f11%2f17%2f27%2f1941cc83-a93c-4c62-9358-bcea99c42c44&filename=20260311+%eb%b2%95%eb%ac%b4%eb%b6%80+%ec%a3%bc%ed%83%9d%ec%9e%84%eb%8c%80%ec%b0%a8+%ed%91%9c%ec%a4%80%ea%b3%84%ec%95%bd%ec%84%9c(%ed%95%9c%ea%b8%80).hwp"
    },
    {
        form_name: "1865-1 상가건물임대차표준계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2019%2f11%2f20%2f16%2f52%2fd0012fae-6f0e-44ef-a55e-d474c96df081&filename=1865-1+%ec%83%81%ea%b0%80%ea%b1%b4%eb%ac%bc%ec%9e%84%eb%8c%80%ec%b0%a8%ed%91%9c%ec%a4%80%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "아파트, 맨션, 빌라 등의 임대사업용건물 임대차계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f16%2f10%2f14%2f57b741f2-27d2-43d7-a91b-d49dbdbc8c47&filename=%ec%95%84%ed%8c%8c%ed%8a%b8%2c+%eb%a7%a8%ec%85%98%2c+%eb%b9%8c%eb%9d%bc+%eb%93%b1%ec%9d%98+%ec%9e%84%eb%8c%80%ec%82%ac%ec%97%85%ec%9a%a9%ea%b1%b4%eb%ac%bc+%ec%9e%84%eb%8c%80%ec%b0%a8%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "건물임대차계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f16%2f10%2f11%2fef808a69-5c85-493d-9a8d-9c8aa9c5dae2&filename=%ea%b1%b4%eb%ac%bc%ec%9e%84%eb%8c%80%ec%b0%a8%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "임대차계약서(임대인 부재)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f16%2f10%2f14%2f20d5aab5-1fbc-4a5c-8ac0-527bfa2cb0d6&filename=%ec%9e%84%eb%8c%80%ec%b0%a8%ea%b3%84%ec%95%bd%ec%84%9c(%ec%9e%84%eb%8c%80%ec%9d%b8+%eb%b6%80%ec%9e%ac).hwp"
    },
    {
        form_name: "1449 고소장 표준서식",
        category: "민형사",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f16%2f10%2f09%2ff8769db3-fd79-43f4-bbf2-432b4e03ebab&filename=%ec%a4%80%eb%b9%84%ec%84%9c%eb%a9%b4(%ea%b1%b4%eb%ac%bc%ec%9d%b8%eb%8f%84%2c+%ed%94%bc%ea%b3%a0).hwp"
    },
    {
        form_name: "1750 토지임대차계약서(사업용)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f15%2f17%2f35%2f84f5859a-ce70-4866-97e8-36151a3d28b2&filename=%ed%86%a0%ec%a7%80%ec%9e%84%eb%8c%80%ec%b0%a8%ea%b3%84%ec%95%bd%ec%84%9c(%ec%82%ac%ec%97%85%ec%9a%a9).hwp"
    },
    {
        form_name: "1721 건물매매계약서(건축 중인 주택 매매)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f10%2f05%2fe01bfd4f-c098-4d99-999f-9b99079b9bbd&filename=%ea%b1%b4%eb%ac%bc%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ea%b1%b4%ec%b6%95+%ec%a4%91%ec%9d%b8+%ec%a3%bc%ed%83%9d+%eb%a7%a4%eb%a7%a4).hwp"
    },
    {
        form_name: "1720 건물매매계약서(토지소유자 별도)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f10%2f05%2f62f3507b-3230-4054-bab5-1bc0d79fb1e7&filename=%ea%b1%b4%eb%ac%bc%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ed%86%a0%ec%a7%80%ec%86%8c%ec%9c%a0%ec%9e%90+%eb%b3%84%eb%8f%84).hwp"
    },
    {
        form_name: "1719 건물매매계약서(임차인이 건물만 매수)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f10%2f05%2fb1e36378-5845-48d8-a216-628c53bfb433&filename=%ea%b1%b4%eb%ac%bc%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ec%9e%84%ec%b0%a8%ec%9d%b8%ec%9d%b4+%ea%b1%b4%eb%ac%bc%eb%a7%8c+%eb%a7%a4%ec%88%98).hwp"
    },
    {
        form_name: "1733 부동산매매검인계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f04%2f06120f39-0a0a-425b-8467-2348f8797369&filename=%eb%b6%80%eb%8f%99%ec%82%b0%eb%a7%a4%eb%a7%a4%ea%b2%80%ec%9d%b8%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "1734 부동산매매계약서(일반)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f04%2fc8d178bd-dc9a-48df-bdca-4a8077448bbe&filename=%eb%b6%80%eb%8f%99%ec%82%b0%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ec%9d%bc%eb%b0%98).hwp"
    },
    {
        form_name: "1737 토지매매계약서(일반)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f32%2f4c90db66-1d11-4b90-b3fa-2ba833e5fbbb&filename=%ed%86%a0%ec%a7%80%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ec%9d%bc%eb%b0%98).hwp"
    },
    {
        form_name: "1738 토지매매계약서(가환지)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f32%2f90efabf4-77b1-4643-bff7-b547e815fa0e&filename=%ed%86%a0%ec%a7%80%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ea%b0%80%ed%99%98%ec%a7%80).hwp"
    },
    {
        form_name: "1633 소유권이전등기(단독주택 매매)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f09%2f7844a869-9196-48f6-aa81-09f5516a9807&filename=%ec%86%8c%ec%9c%a0%ea%b6%8c%ec%9d%b4%ec%a0%84%eb%93%b1%ea%b8%b0(%eb%8b%a8%eb%8f%85%ec%a3%bc%ed%83%9d+%eb%a7%a4%eb%a7%a4).hwp"
    },
    {
        form_name: "329 소유권이전등기청구의 소(귀속재산 불하, 토지)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f12%2fea92e486-cb2c-43b8-8762-212cc3f033cd&filename=%ec%86%8c%ec%9c%a0%ea%b6%8c%ec%9d%b4%ec%a0%84%eb%93%b1%ea%b8%b0%ec%b2%ad%ea%b5%ac%ec%9d%98+%ec%86%8c(%ea%b7%80%ec%86%8d%ec%9e%ac%ec%82%b0+%eb%b6%88%ed%95%98%2c+%ed%86%a0%ec%a7%80).hwp"
    },
    {
        form_name: "360 소유권이전등기청구의 소(매도인이 매수인을 상대로)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f13%2fcd0056e1-6b0e-411f-babf-e532f01970ce&filename=%ec%86%8c%ec%9c%a0%ea%b6%8c%ec%9d%b4%ec%a0%84%eb%93%b1%ea%b8%b0%ec%b2%ad%ea%b5%ac%ec%9d%98+%ec%86%8c(%eb%a7%a4%eb%8f%84%ec%9d%b8%ec%9d%b4+%eb%a7%a4%ec%88%98%ec%9d%b8%ec%9d%84+%ec%83%81%eb%8c%80%eb%a1%9c).hwp"
    },
    {
        form_name: "318 소유권이전등기청구의 소(토지, 매수인의 상속인이 매도인에게)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f15%2f8f1becf4-3822-4d80-9d5f-7f6947034d38&filename=%ec%86%8c%ec%9c%a0%ea%b6%8c%ec%9d%b4%ec%a0%84%eb%93%b1%ea%b8%b0%ec%b2%ad%ea%b5%ac%ec%9d%98+%ec%86%8c(%ed%86%a0%ec%a7%80%2c+%eb%a7%a4%ec%88%98%ec%9d%b8%ec%9d%98+%ec%83%81%ec%86%8d%ec%9d%b8%ec%9d%b4+%eb%a7%a4%eb%8f%84%ec%9d%b8%ec%97%90%ea%b2%8c).hwp"
    },
    {
        form_name: "1743 토지, 건물분양계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f22%2fcd7414f2-ffb5-482d-b711-722a15deb8bd&filename=%ed%86%a0%ec%a7%80%2c+%ea%b1%b4%eb%ac%bc%eb%b6%84%ec%96%91%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "1736 아파트공급표준계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f15%2f039c175c-bf22-48a9-9b3f-55d5ba943ed6&filename=%ec%95%84%ed%8c%8c%ed%8a%b8%ea%b3%b5%ea%b8%89%ed%91%9c%ec%a4%80%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "1742 토지, 건물매매계약서(임차인이 있는 경우)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f13%2f15%2f22%2f82cb1afe-8375-4ac7-83ae-d2c431a958e8&filename=%ed%86%a0%ec%a7%80%2c+%ea%b1%b4%eb%ac%bc%eb%a7%a4%eb%a7%a4%ea%b3%84%ec%95%bd%ec%84%9c(%ec%9e%84%ec%b0%a8%ec%9d%b8%ec%9d%b4+%ec%9e%88%eb%8a%94+%ea%b2%bd%ec%9a%b0).hwp"
    }
]

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB 연결 성공!");

        await Form.deleteMany({});

        await Form.insertMany(klacForms);
        console.log("대한법률구조공단 양식 데이터 삽입 완료!");

        mongoose.connection.close();
    } catch (error) {
        console.error("데이터 삽입 중 에러: ", error);
    }
};

seedDB();
