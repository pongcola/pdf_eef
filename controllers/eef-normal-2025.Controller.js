import axios from "axios";
import mysql from "mysql2";
import pool from '../config/connect_eef_sp.js';

import PDFDocument from 'pdfkit-table';
import thmaker from 'pdfmake-thaifont-2';
import { Base64Encode } from 'base64-stream';

const cov = (u) => {
    const x = u * 2.83;
    return x;
};

const voc = (u) => {
    const x = u / 2.83;
    return x;
};



const run = async (req, res) => {
    const pdfBase64 = await genDoc();
}

const covDateTH = (e) => {
    const date = new Date(e);

    const result = date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    return result
}

const covDate = (e, t) => {
    let dateSp = e.split("/");

    let D = dateSp["0"];
    let M = dateSp["1"];
    let Y = dateSp["2"];
    if (t == "60") {
        Y = parseInt(dateSp[2]) + 60;
    } else {
        Y = dateSp["2"];
    }

    return D + " " + MONTHSSUBDOT[M] + " " + Y;
}

const getData = async (u_id) => {
    let Objs = {
        "Main": [],
        "Person": {
            "Major": [],
            "Ceo": [],
            "Project": [],
            "Manage": [],
            "ManageMain": [],
            "Emp": [],
        },
        "Major": [],
        "Product": [],
        "Users": [],
        "Product2": [],
        "Dorm": [],
        "Manage": [],
        "AreaHeight": [],
        "Files": []
    }

    const typeData = {
        "ผู้บริหารคณะ": "Major",
        "ผู้บริหารสถานศึกษา": "Ceo",
        "ผู้ประสานงานหลักของโครงการ": "Project",
        "ผู้รับผิดชอบโครงการ": "Manage",
        "เจ้าหน้าที่การเงินโครงการ": "Emp",
    }
    try {
        const connection = await pool.getConnection()
        const sqls = `SELECT * FROM innovet_special_2024_school_info a INNER JOIN innovet_special_2024_school b ON a.u_id = b.s_id WHERE a.u_id = '${u_id}' `
        const resMerchant = await connection.query(sqls)
        if (resMerchant.length > 0) {
            Objs['Main'] = resMerchant[0];
        }

        const sqlUsers = `SELECT * FROM innovet_special_2024_user WHERE u_id = '${u_id}' `
        const resUsers = await connection.query(sqlUsers)
        if (resUsers.length > 0) {
            Objs['Users'] = resUsers[0];
        }
        const sqlCeo = `SELECT * FROM innovet_special_2024_personal WHERE u_id = '${u_id}'`
        const resCeo = await connection.query(sqlCeo)
        if (resCeo.length > 0) {
            for await (const D of resCeo[0]) {
                Objs['Person'][typeData[D.p_section]] = D;
            }
        }
        const sqlMainCeo = `SELECT *  FROM innovet_special_2024_personal WHERE p_section = 'ผู้บริหารสถานศึกษา' AND u_id = '${u_id}'`
        const resMainCeo = await connection.query(sqlMainCeo)
        if (resMainCeo.length > 0) {
            Objs['Person']['Ceo'] = resMainCeo[0][0];
        }


        const sqlMainManage = `SELECT *  FROM innovet_special_2024_personal WHERE p_section IN ('ผู้ช่วยผู้รับผิดชอบโครงการ คนที่ 1','ผู้ช่วยผู้รับผิดชอบโครงการ คนที่ 2','ผู้ช่วยผู้รับผิดชอบโครงการ คนที่ 3') AND u_id = '${u_id}'`
        const resMainManage = await connection.query(sqlMainManage)
        if (resMainManage.length > 0) {
            Objs['Person']['Manage'] = resMainManage[0];
        }


        const sqlMainManageMain = `SELECT *  FROM innovet_special_2024_personal WHERE p_section IN ('ผู้รับผิดชอบโครงการ') AND u_id = '${u_id}'`
        const resMainManageMain = await connection.query(sqlMainManageMain)
        if (resMainManageMain.length > 0) {
            Objs['Person']['ManageMain'] = resMainManageMain[0];
        }


        const sqlProblem = `SELECT * FROM innovet_special_2024_objective WHERE u_id = '${u_id}'`
        const resProblem = await connection.query(sqlProblem)
        if (resProblem.length > 0) {
            Objs['Problem'] = resProblem[0];
        }

        let MainMajors = {}
        let chkMid = 0
        const sqlMajor = `SELECT * , '' as teacher , '' as Approve FROM innovet_special_2024_major a LEFT JOIN innovet_special_2024_major_detail b ON a.m_id = b.m_id WHERE a.u_id = '${u_id}'`
        const [resMajor] = await connection.query(sqlMajor)
        if (resMajor.length > 0) {
            for await (const m of resMajor) {
                if (chkMid != m.m_id) {
                    MainMajors[m.m_id] =
                    {
                        "m_major": "",
                        "m_work": "",
                        "m_subject": "",
                        "md_total_open": "",
                        "md_total_teacher": "",
                        "md_sc_detail_course": "",
                        "years": [],
                        "teacher": [],
                        "Approve": []
                    }
                }
                if (m.md_year != '') {
                    MainMajors[m.m_id]['years'].push({
                        "md_total_student": m.md_total_student,
                        "md_special_student": m.md_special_student,
                        "md_blind_student": m.md_blind_student,
                        "md_deaf_student": m.md_deaf_student,
                        "md_physical_student": m.md_physical_student,
                        "md_mind_student": m.md_mind_student,
                        "md_wit_student": m.md_wit_student,
                        "md_learning_student": m.md_learning_student,
                        "md_autism_student": m.md_autism_student,
                        "md_year": m.md_year,
                    })
                } else {
                    MainMajors[m.m_id]['md_total_open'] = m.md_total_open
                    MainMajors[m.m_id]['md_total_teacher'] = m.md_total_teacher
                    MainMajors[m.m_id]['md_sc_detail_course'] = m.md_sc_detail_course
                    MainMajors[m.m_id]['m_major'] = m.m_major
                    MainMajors[m.m_id]['m_work'] = m.m_work
                    MainMajors[m.m_id]['m_subject'] = m.m_subject
                    MainMajors[m.m_id]['m_fund'] = m.m_fund
                }
                chkMid = m.m_id
            }
            Objs['Major'] = MainMajors;
        }

        for await (const [i, v] of Object.entries(Objs['Major'])) {
            let sqlSubApprove = `SELECT * FROM innovet_special_2024_major_approve WHERE m_id = '${i}' AND u_id = '${u_id}'`
            const [resSubApprove] = await connection.query(sqlSubApprove)
            if (resSubApprove.length > 0) {
                Objs['Major'][i]['Approve'] = resSubApprove
            }

            let sqlSubTeacher = `SELECT * FROM innovet_special_2024_major_teacher WHERE m_id = '${i}' AND u_id = '${u_id}'`
            const [resSubTeacher] = await connection.query(sqlSubTeacher)
            if (resSubTeacher.length > 0) {
                Objs['Major'][i]['teacher'] = resSubTeacher
            }
        }


        const sqlSupReflect = `SELECT a.* , b.m_major, b.m_work FROM innovet_special_2024_support_reflect a INNER JOIN innovet_special_2024_major b ON a.m_id = b.m_id WHERE  a.u_id = '${u_id}'`
        const [resSupReflect] = await connection.query(sqlSupReflect)
        if (resSupReflect.length > 0) {
            Objs['SupReflect'] = resSupReflect;
        }

        const sqlSupReflectOth = `SELECT * FROM innovet_special_2024_support_reflect_oth WHERE u_id = '${u_id}'`
        const [resSupReflectOth] = await connection.query(sqlSupReflectOth)
        if (resSupReflectOth.length > 0) {
            Objs['SupReflectOth'] = resSupReflectOth;
        }


        const sqlDorm = `SELECT * FROM innovet_special_2024_dorm_check WHERE u_id = '${u_id}'`
        const [resDorm] = await connection.query(sqlDorm)
        if (resDorm.length > 0) {
            Objs['Dorm'] = resDorm;
        }

        const sqlDormSub = `SELECT * FROM innovet_special_2024_dorm WHERE u_id = '${u_id}'`
        const [resDormSub] = await connection.query(sqlDormSub)
        if (resDormSub.length > 0) {
            Objs['DormSub'] = resDormSub;
        }

        const sqlArea = `SELECT a.*, b.m_major, b.m_work FROM innovet_special_2024_teach_place a INNER JOIN innovet_special_2024_major b ON a.m_id = b.m_id WHERE a.u_id = '${u_id}'`
        const [resArea] = await connection.query(sqlArea)
        if (resArea.length > 0) {
            Objs['Area'] = resArea;
        }


        const sqlAnyToon = `SELECT * FROM innovet_special_2024_support WHERE sp_section = 'ทุนอื่น' AND u_id = '${u_id}' `
        const [resAnyToon] = await connection.query(sqlAnyToon)
        if (resAnyToon.length > 0) {
            Objs['AnyToon'] = resAnyToon;
        }
        const sqlToon = `SELECT * FROM innovet_special_2024_support WHERE sp_section = 'ทุนนวัตกรรม' AND (u_id = '${u_id}' OR sp_school = '${Objs['Users'][0]['u_school']}') `
        const [resToon] = await connection.query(sqlToon)
        if (resToon.length > 0) {
            Objs['Toon'] = resToon;
        }
        const sqlSuportChk = `SELECT * FROM innovet_special_2024_support_check WHERE u_id = '${u_id}'`
        const [resSuportChk] = await connection.query(sqlSuportChk)
        if (resSuportChk.length > 0) {
            Objs['SuportChk'] = resSuportChk;
        }

        const sqlGuide = `SELECT * FROM innovet_special_2024_guide WHERE u_id = '${u_id}'`
        const [resGuide] = await connection.query(sqlGuide)
        if (resGuide.length > 0) {
            Objs['Guide'] = resGuide;
        }

        const sqlCourse = `SELECT a.* , b.m_major , b.m_work   FROM innovet_special_2024_course a INNER JOIN innovet_special_2024_major b ON a.m_id = b.m_id WHERE a.u_id = '${u_id}' `
        const [resCourse] = await connection.query(sqlCourse)
        if (resCourse.length > 0) {
            Objs['Course'] = resCourse;
        }


        const sqlTotalFund = `SELECT SUM(m_fund) AS TotalFund FROM innovet_special_2024_major WHERE u_id = '${u_id}' `
        const [resTotalFund] = await connection.query(sqlTotalFund)
        if (resTotalFund.length > 0) {
            Objs['TotalFund'] = resTotalFund;
        }

        const sqlProduct = `SELECT * FROM innovet_special_2024_product WHERE pd_section = 'ผลผลิต' AND u_id = '${u_id}'`
        const [resProduct] = await connection.query(sqlProduct)
        if (resProduct.length > 0) {
            Objs['Product'] = resProduct;
        }
        const sqlProduct2 = `SELECT * FROM innovet_special_2024_product WHERE pd_section = 'ผลลัพธ์' AND u_id = '${u_id}'`
        const [resProduct2] = await connection.query(sqlProduct2)
        if (resProduct2.length > 0) {
            Objs['Product2'] = resProduct2;
        }
        const sqlManage = `SELECT * FROM innovet_special_2024_manage WHERE u_id = '${u_id}' `
        const [resManage] = await connection.query(sqlManage)
        if (resManage.length > 0) {
            Objs['Manage'] = resManage;
        }


        const sqlSurvey = `SELECT * FROM innovet_special_2024_survey_student WHERE u_id = '${u_id}'`
        const [resSurvey] = await connection.query(sqlSurvey)
        if (resSurvey.length > 0) {
            Objs['Survey'] = resSurvey;
        }

        const sqlMarkerUp = `SELECT * FROM innovet_special_2024_marker WHERE u_id = '${u_id}' AND mk_data != '' `
        const [resMarkerUp] = await connection.query(sqlMarkerUp)
        if (resMarkerUp.length > 0) {
            Objs['MarkerUp'] = resMarkerUp;
        }
        const sqlMarkerDown = `SELECT * FROM innovet_special_2024_marker WHERE u_id = '${u_id}'  AND mk_data = '' `
        const [resMarkerDown] = await connection.query(sqlMarkerDown)
        if (resMarkerDown.length > 0) {
            Objs['MarkerDown'] = resMarkerDown;
        }

        const sqlFiles = `SELECT  concat('https://eefinnovet.com/',f_folder2) as f_folder2,u_section FROM innovet_special_2024_files WHERE  u_id = '${u_id}'`
        const [resFiles] = await connection.query(sqlFiles)
        if (resFiles.length > 0) {
            Objs['Files'] = {}
            for await (const i of resFiles) {
                Objs['Files'][i.u_section] = i.f_folder2
            }
        }

        // console.log(Objs)
        return Objs
    } catch (error) {
        console.log(error)
        return null
        return false
    }
}

export const PDF1 = async (req) => {
    let countManage = 1

    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';
        const pipeLine = true;

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });


        if(pipeLine){

        let testFooter = -10
        for (let fi =0 ; fi <= 19; fi++){
            s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
            doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
        }
        testFooter = -10
        for (let fi =0 ; fi <= 30; fi++){
            s = { "x": 0, "y": testFooter+=10, "w": 220, "h": 10, "bd": border }
            doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
        }
        }


        doc.font(Bold).fontSize(18).fillColor('black');


        s = { "x": 35, "y": 20, "w": 156, "h": 6.5, "bd": border }
        doc.lineJoin('round')
            .roundedRect(cov(20), cov(s['y']), cov(170), cov(42), cov(5))
            .stroke('black');

        s = { "x": 20, "y": 25, "w": 170, "h": 6, "bd": border }
        doc.fillColor("black").text('แบบเสนอ “โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปี ๒๕๖๘”', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'] + 2, "w": 170, "h": 6, "bd": border }
        doc.fillColor("black").text('“สำหรับสถานศึกษาทั่วไป”', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'] + 2, "w": 170, "h": 6, "bd": border }
        doc.fillColor("black").text('(ทุน ๑ ปี หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล/ผู้ช่วยทันตแพทย์)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 20, "y": s['y'] + s['h'] + 2, "w": 170, "h": 6, "bd": border }
        doc.fillColor("black").text('กองทุนเพื่อความเสมอภาคทางการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



        doc.font(Bold).fontSize(16).fillColor('black');
        s = { "x": 20, "y": s['y'] + s['h'] + 20, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('คำอธิบาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ก่อนจัดทำแบบเสนอโครงการ สถานศึกษาควรศึกษาประกาศสำนักงานกองทุนเพื่อความเสมอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.56 });
        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ภาคทางการศึกษา เรื่อง เปิดรับข้อเสนอโครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปี ๒๕๖๘ อย่าง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.42 });
        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ละเอียด", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ยื่นแบบเสนอโครงการ ผ่านเว็บไซต์ กสศ. https://eefinnovet.com โดยกรอกข้อมูลและ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.72 });
        doc.moveTo(cov(105), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 35), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()
        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ส่งเอกสารตามกำหนดให้ครบถ้วน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('3.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("แบบเสนอโครงการการส่งเสริมนักเรียนที่ขาดแคลนทุนทรัพย์และด้อยโอกาสให้ได้รับการศึกษา ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.45 });
        s = { "x": 35, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ต่อสายอาชีพชั้นสูง ในโครงการทุนนวัตกรรมสายอาชีพชั้นสูง ประกอบด้วย ๓ ส่วน ได้แก่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });
        s = { "x": 40, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไป ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": 40, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ส่วนที่ 2 รายละเอียดโครงการ  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": 40, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ส่วนที่ 3 คำรับรอง  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('4.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("สถานศึกษาควรศึกษาเอกสาร และกรอกข้อมูลให้ครบถ้วนชัดเจนเพื่อประโยชน์ต่อการพิจารณา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.42 });
        s = { "x": 35, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("และตรวจสอบความถูกต้องของเอกสารก่อนการยื่นข้อเสนอโครงการผ่านระบบออนไลน์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });
       

        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.lineJoin('round')
            .roundedRect(cov(20), cov(s['y'] + 14), cov(170), cov(26), cov(5))
            .stroke();
        s = { "x": 20, "y": s['y'] + s['h'] + 12, "w": 170, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('แบบเสนอโครงการสำหรับสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



        s = { "x": 23, "y": s['y'] + s['h'] + 2, "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ข้อมูลทั่วไป                    รายละเอียดโครงการ                    คำรับรอง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.lineJoin('miter').rect(cov(44), cov(s['y']), cov(5), cov(5)).stroke();
        doc.lineJoin('miter').rect(cov(85), cov(s['y']), cov(5), cov(5)).stroke();
        doc.lineJoin('miter').rect(cov(140), cov(s['y']), cov(5), cov(5)).stroke();

        doc.lineJoin('round')
            .roundedRect(cov(20), cov(s['y'] + 30), cov(170), cov(45), cov(5))
            .stroke();
        s = { "x": 20, "y": s['y'] + s['h'] + 31, "w": 170, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('ขั้นตอนการยื่นแบบเสนอโครงการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('การยื่นแบบเสนอโครงการขอให้ผ่านระบบออนไลน์ที่เว็บไซต์ https://eefinnovet.com ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(129), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']-21.5 ), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่วันที่ 13 – 27 ธันวาคม ๒๕๖๗', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 33, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('สอบถามข้อมูลเพิ่มเติม  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('   โทร. 02-079-5475 กด 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('และอีเมล innovative@eef.or.th', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



        doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })
        

        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไป', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })
        


        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 170, "h": 6.5, "bd": border }
        doc.fontSize(14).font(Bold).fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไป', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(89), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w'] - 69), cov(s['y'] + s['h'] - 2)).dash(1, { space: 0.01 }).stroke()
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ชื่อโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา ๒๕๖๘ ประเภททุน ๑ ปี หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text(`ของ`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
        doc.font(ThS).fontSize(14).fillColor("black").text(`I0001`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
        doc.moveTo(cov(s['x']+7), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา ๒๕๖๘ ประเภททุน ๑ ปี หลักสูตประกาศนียบัตรผู้ช่วยทันตแพทย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.07 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text(`ของ`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
        doc.font(ThS).fontSize(14).fillColor("black").text(`I0002`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
        doc.moveTo(cov(s['x']+7), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา ๒๕๖๘ ประเภททุนหลักสูตรระยะสั้นประกาศนียบัตรพนักงานให้การดูแล*', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.21});
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text(`ของ`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
        doc.font(ThS).fontSize(14).fillColor("black").text(`I0003`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
        doc.moveTo(cov(s['x']+7), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('(*ในกรณีที่สถานศึกษาจะเสนอทั้งสองประเภททุน ต้องเป็นสถานศึกษาที่เข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล ไม่น้อยกว่า ๒ ปี )', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.moveTo(cov(76), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 93), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('**ในกรณีที่สถานศึกษาเสนอหลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล และหลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.53 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('ขอให้จัดทำข้อเสนอโครงการแยกตามประเภททุน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });




        s = { "x": 20, "y": s['y'] + s['h']+5, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ข้อมูลองค์กรผู้เสนอโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 125, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ในกรณีที่สถานศึกษาที่มีเขตพื้นที่หรือวิทยาเขตหรือมีลักษณะอื่นที่คล้ายคลึงเขตพื้นที่หรือวิทยาเขต", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.03 });
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('ให้เสนอโครงการในนามสถานศึกษาเท่านั้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0004`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่ตั้ง: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 66, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0006`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0007`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0008`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0009`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0010`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรสาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 76.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0011`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 76.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0012`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เลขประจำตัวผู้เสียภาษี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0013`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สังกัด ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w']+10, "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("สำนักงานคณะกรรมการการอาชีวศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] -8), cov(s['y'] + 3), cov(2.5)).undash().stroke();
       
        s = { "x": 40, "y": s['y'] + s['h'], "w": 130, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สถาบันวิทยาลัยชุมชน กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] -8), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 40, "y": s['y'] + s['h'], "w": 130, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] -8), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 40, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineWidth(0).stroke();
        doc.lineCap('square').circle(cov(s['x'] -8 ), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0014`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        // if (MainData.si_member == "สำนักงานคณะกรรมการการอาชีวศึกษา") {
            doc.image('img/check.png', cov(30), cov(149), { width: cov(5), height: cov(5) })
        // } else if (MainData.si_member == "สถาบันวิทยาลัยชุมชน กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม") {
            doc.image('img/check.png', cov(30), cov(155.5), { width: cov(5), height: cov(5) })
        // } else if (MainData.si_member == "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม") {
            doc.image('img/check.png', cov(30), cov(162), { width: cov(5), height: cov(5) })
        // } else if (MainData.si_member == "อื่น ๆ") {
            doc.image('img/check.png', cov(30), cov(168.5), { width: cov(5), height: cov(5) })
        // }


        doc.lineWidth(0).stroke();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประเภทสถานศึกษา                   รัฐ                   เอกชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 40), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 65), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        // if (MainData.si_school_type == "รัฐ") {
            doc.image('img/check.png', cov(58), cov(175), { width: cov(5), height: cov(5) })
        // } else if (MainData.si_school_type == "เอกชน") {
            doc.image('img/check.png', cov(83), cov(175), { width: cov(5), height: cov(5) })
        // }

        s = { "x": 20, "y": s['y'] + s['h'], "w": 58, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('การรับรองสถาบันการศึกษา หรือหลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 125, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text(" (* โปรดแนบเอกสารการรับรอง)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.03 });
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 84, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('  หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล ได้รับการรับรองสถาบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0015`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(สถาบันต้องได้รับการรับรองจากสภาการพยาบาล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.1 });
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
        doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 58, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ไม่น้อยกว่า ๓ ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
       
        s = { "x": 25, "y": s['y'] + s['h'], "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('  หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์ ได้รับการรับรองหลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0016`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(4), cov(4)).undash().stroke();
       
        s = { "x": 25, "y": s['y'] + s['h'], "w": 104, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('  หลักสูตรระยะสั้นประกาศนียบัตรพนักงานให้การดูแล ได้รับการรับรองหลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0017`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('(หลักสูตรระยะสั้น ๖ เดือน ที่สภาการพยาบาลให้การรับรอง และมีระยะเวลาการอบรมจำนวนไม่น้อยกว่า๕๑๐ ชั่วโมง)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
       
        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ระดับการศึกษาที่เปิดสอน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 27, "y": s['y'] + s['h'], "w": 77.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตร หลักสูตร 1 ปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 77.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตรวิชาชีพ (ปวช.)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(4), cov(4)).undash().stroke();

        s = { "x": 27, "y": s['y'] + s['h'], "w": 77.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อนุปริญญา หลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(4), cov(4)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0018`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 3, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0019`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 27, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปริญญาตรี หลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(4), cov(4)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0020`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 3, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0021`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 27, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(4), cov(4)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0022`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            doc.image('img/check.png', cov(20), cov(130+95.5), { width: cov(5), height: cov(5) })
            doc.image('img/check.png', cov(97.5), cov(130+95.5), { width: cov(5), height: cov(5) })
            doc.image('img/check.png', cov(20), cov(136.5+95.5), { width: cov(5), height: cov(5) })
            doc.image('img/check.png', cov(97.5), cov(136.5+95.5), { width: cov(5), height: cov(5) })
            doc.image('img/check.png', cov(20), cov(143+95.5), { width: cov(5), height: cov(5) })
            doc.image('img/check.png', cov(20), cov(149.5+95.5), { width: cov(5), height: cov(5) })

        s = { "x": 20, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทั้งสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0023`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน จำนวนอาจารย์ทั้งสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0024`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนอาจารย์ที่ทำหน้าที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0025`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 72, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน จำนวนบุคคลากรสายสนับสนุนที่ไม่ได้ทำหน้าที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0026`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน แบ่งออกเป็น  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อาจารย์ประจำ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0027`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 29, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน อาจารย์อัตราจ้าง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0028`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 24, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน  อาจารย์พิเศษ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0029`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ (โปรดระบุ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0030`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

         doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })
     

        s = { "x": 20, "y": 20, "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับประกาศนียบัตร 1 ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0031`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke('black')
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 49, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับ ปวช', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0032`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 49, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับ ปวส', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0033`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 57, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับอนุปริญญา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0034`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 57, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I003`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับหลักสูตรระยะสั้น (๓ เดือน – ๑ ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0035`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับ (อื่น ๆ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0036`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'] + 5, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('3.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0037`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0038`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0039`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0040`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0041`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0042`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0043`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0044`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0045`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0046`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        s = { "x": 20, "y": s['y'] + s['h'], "w": 110, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ระยะเวลาในการดำรงตำแหน่งผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี ณ แห่งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0047`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่ (วัน/เดือน/ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0048` + "/" + `I0049` + "/" + `I0050`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ถึงปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0051`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        doc.image('img/check.png', cov(138.5), cov(Types == "นวัตกรรม" ? 124.5 : 129.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(122.5), cov(Types == "นวัตกรรม" ? 124.5 : 129.5), { width: cov(5), height: cov(5) })
      

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(4), cov(4)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(4), cov(4)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0052`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

       
        doc.image('img/check.png', cov(48), cov(134.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(48), cov(141), { width: cov(5), height: cov(5) })


        s = { "x": 20, "y": s['y'] + s['h'] +5, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('4.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ผู้บริหารคณะ/สำนักวิชา/คณบดี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0053`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0054`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0055`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0056`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0057`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0058`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0059`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0060`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0061`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0062`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        s = { "x": 20, "y": s['y'] + s['h'], "w": 93, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ระยะเวลาในการดำรงตำแหน่งผู้บริหารคณะ/สำนักวิชา/คณบดี ณ แห่งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0063`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่ (วัน/เดือน/ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0064` + "/" + `I0064` + "/" + `I0064`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ถึงปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0065`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0066`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        
        doc.image('img/check.png', cov(138.5), cov(212), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(122.5), cov(212), { width: cov(5), height: cov(5) })
        
        doc.image('img/check.png', cov(48), cov(218.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(48), cov(225), { width: cov(5), height: cov(5) })


        doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })

        s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('5.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).stroke('black');

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 29, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ผู้รับผิดชอบโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 136, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text(" (ผู้ดำเนินการหลักของโครงการ โดยเป็นผู้ที่มีบทบาทหน้าที่ในการบริหารจัดการโครงการและงบประมาณ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.06 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('อยู่ในระดับผู้บริหารสถานศึกษา หรือไม่ต่ำกว่ากว่าระดับหัวหน้าแผนกที่เกี่ยวข้องกับสาขาที่ยื่นเสนอขอโปรดแนบประวัติ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.44 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 37, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ผู้รับผิดชอบโครงการโดยย่อ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 133, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("กรณีที่เป็นสถานศึกษาที่เคยเข้าร่วมโครงการ ผู้รับผิดชอบโครงการต้องเป็นมีประสบการณ์รับทุน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 37, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("กสศ. ไม่น้อยกว่า ๑ ปี)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.04 });

        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0067`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 126, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0068`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำแหน่งในสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0069`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'] + 6.5, "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ตำแหน่งทางราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูผู้ช่วย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูพิเศษสอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(127), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 50, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูอัตราจ้าง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พนักงานมหาวิทยาลัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 50, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พนักงานราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 78, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0070`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สอนในรายวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0071`, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
      
        s = { "x": 20, "y": s['y'] + s['h'], "w": 35, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระดับชั้นที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(82), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(117), cov(s['y']), cov(5), cov(5)).stroke();


        s = { "x": 55, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(82), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(117), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(151), cov(s['y']), cov(5), cov(5)).stroke();


        s = { "x": 55, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ประกาศนียบัตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(82), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาโท', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(117), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาเอก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(151), cov(s['y']), cov(5), cov(5)).stroke();


        s = { "x": 55, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0072`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0073`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0074`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0075`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0076`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0077`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0078`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0079`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 76.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0080`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0081`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 67, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0082`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        doc.image('img/check.png', cov(57), cov(72), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(72), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(127), cov(72), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(57), cov(78.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(78.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(57), cov(85), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(85), { width: cov(5), height: cov(5) })

        doc.image('img/check.png', cov(47), cov(98), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(82), cov(98), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(117), cov(98), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(47), cov(104.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(82), cov(104.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(117), cov(104.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(151), cov(104.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(47), cov(111), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(82), cov(111), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(117), cov(111), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(151), cov(111), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(47), cov(117.5), { width: cov(5), height: cov(5) })

        doc.image('img/check.png', cov(123), cov(150), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(139), cov(150), { width: cov(5), height: cov(5) })
        
        doc.image('img/check.png', cov(48), cov(156), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(48), cov(163), { width: cov(5), height: cov(5) })


        s = { "x": 20, "y": s['y'] + s['h'] + 5, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('6.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).stroke('black');

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 43, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ผู้ประสานงานหลักของโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 122, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผู้ที่มีบทบาทหน้าที่ในการประสานงานการดำเนินการกับกองทุนเพื่อความเสมอภาคทางการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.08 });
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('กสศ.) อาทิเช่น การนำส่งผลงานประกอบการเบิกเงินงวด การนัดหมายการประชุมการจัดกิจกรรม ฯลฯ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0});

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0083`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 126, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0084`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำแหน่งในสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0085`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'] + 6.5, "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ตำแหน่งทางราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูผู้ช่วย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูพิเศษสอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(127), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 50, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูอัตราจ้าง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พนักงานมหาวิทยาลัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 50, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พนักงานราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 78, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0086`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สอนในรายวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0087`, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
      
        s = { "x": 20, "y": s['y'] + s['h'], "w": 35, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระดับชั้นที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(82), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(117), cov(s['y']), cov(5), cov(5)).stroke();


        s = { "x": 55, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(82), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(117), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(151), cov(s['y']), cov(5), cov(5)).stroke();


        s = { "x": 55, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ประกาศนียบัตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(82), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาโท', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(117), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาเอก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(151), cov(s['y']), cov(5), cov(5)).stroke();


        s = { "x": 55, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(47), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0088`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        doc.image('img/check.png', cov(57), cov(72 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(72 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(127), cov(72 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(57), cov(78.5 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(78.5 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(57), cov(85 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(85 +141), { width: cov(5), height: cov(5) })

        doc.image('img/check.png', cov(47), cov(98 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(82), cov(98 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(117), cov(98 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(47), cov(104.5 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(82), cov(104.5 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(117), cov(104.5 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(151), cov(104.5 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(47), cov(111 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(82), cov(111 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(117), cov(111 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(151), cov(111 +141), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(47), cov(117.5 +141), { width: cov(5), height: cov(5) })

         doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })

        s = { "x": 20, "y": 20, "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0089`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0090`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0091`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0092`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0093`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0094`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0095`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 76.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0096`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0097`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 67, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0098`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        doc.image('img/check.png', cov(123), cov(46), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(139), cov(46), { width: cov(5), height: cov(5) })
        
        doc.image('img/check.png', cov(48), cov(52.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(48), cov(59), { width: cov(5), height: cov(5) })


        s = { "x": 20, "y": s['y'] + s['h'] + 5, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('7.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).stroke('black');

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("เจ้าหน้าที่การเงินโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 130, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text(" (ผู้ที่มีความรู้และความสามารถด้านการจัดทำบัญชี รายงานการเงิน โดยเป็นเจ้าหน้าที่การเงินของ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });
        doc.moveTo(cov(150), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('สถานศึกษาที่ได้รับมอบหมายเท่านั้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0});
        doc.moveTo(cov(20), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']-124), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0099`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 126, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำแหน่งในสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0101`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'] + 6.5, "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ตำแหน่งทางราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูผู้ช่วย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูพิเศษสอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(127), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 50, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ครูอัตราจ้าง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พนักงานมหาวิทยาลัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 50, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พนักงานราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(57), cov(s['y']), cov(5), cov(5)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 78, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0102`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        doc.lineJoin('miter').rect(cov(94), cov(s['y']), cov(5), cov(5)).stroke();
        

        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0103`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0104`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0105`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0106`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0107`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0108`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0109`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 76.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0110`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0111`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 67, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0112`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        
        doc.image('img/check.png', cov(57), cov(109), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(109), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(127), cov(109), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(57), cov(115.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(115.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(57), cov(122), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(94), cov(122), { width: cov(5), height: cov(5) })


        doc.image('img/check.png', cov(123), cov(155), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(139), cov(155), { width: cov(5), height: cov(5) })
        
        doc.image('img/check.png', cov(48), cov(161.5), { width: cov(5), height: cov(5) })
        doc.image('img/check.png', cov(48), cov(167.5), { width: cov(5), height: cov(5) })



        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};


export const PDF2 = async (req) => {
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = false;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(150), height: cov(s['h']), align: 'center' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(450), height: cov(s['h']), align: 'center' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }

        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('9.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 180, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานศึกษาเคยรับทุนสนับสนุนของ กสศ. หรือไม่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุน กสศ. (ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] + 7), cov(s['y'] + 3), cov(2)).undash().stroke();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ระบุชื่อทุนที่เคยรับ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 200, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 13, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปีที่รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 32, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุนนวัตกรรมสายอาชีพชั้นสูง ของ กสศ. โดยขอให้ข้อมูลความสำเร็จ การคงอยู่ในระบบการศึกษาและการมีงานทำของนักศึกษาทุน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] + 7), cov(s['y'] + 3), cov(2)).undash().stroke();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        let AnyToon = [
            {
                sp_name: '1',
                sp_year: '1',
                sp_success: '1',
                sp_success1: '1',
                sp_success2: '1',
                sp_success3: '1',
                sp_success4: '1',
                sp_success5: '1',
            },
            {
                sp_name: '2',
                sp_year: '2',
                sp_success: '2',
                sp_success1: '2',
                sp_success2: '2',
                sp_success3: '2',
                sp_success4: '2',
                sp_success5: '2',
            },
            {
                sp_name: '3',
                sp_year: '3',
                sp_success: '3',
                sp_success1: '3',
                sp_success2: '3',
                sp_success3: '3',
                sp_success4: '3',
                sp_success5: '3',
            },
        ]
        let DataTableA = [];
        for await (let X of AnyToon) {
            DataTableA.push(
                [
                    X.sp_name.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_year.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success1.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success2.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success3.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success4.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success5.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                ],
            )
        }
        
        const tableA = {
            title: "ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง",
            headers: [
                { label: "ปีที่รับทุน", headerAlign: "center", align: "center" },
                { label: "ประเภททุน", headerAlign: "center", align: "left" },
                { label: "หลักสูตร", headerAlign: "center", align: "left" },
                { label: "จำนวนนักศึกษา\nที่ได้รับอนุมัติ\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวนนักศึกษา\nทุนสุทธิ*\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวนนักศึกษา\nทุนออกกลางคัน\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวนนักศึกษา\nทุนคงอยู่\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวนนักศึกษา\nทุนที่สำเร็จ\nการศึกษา\n(คน)", headerAlign: "center", align: "right" },
            ],
            rows: DataTableA,
        };
        let cosize = [cov(20),cov(60),cov(60),cov(25),cov(25),cov(25),cov(25),cov(25)]
        doc.font(Bold).fontSize(12).fillColor('black');
        let xr = 0
        let i = 0
        let stIndex = cov(20)
        await doc.table(tableA, {
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black').stroke('black')
                // tableA.headers.forEach((header, index) => {
                //     const cellHeight = cov(19);   // ความสูงของเซลล์หัวตาราง
                //     if(i < tableA.headers.length){
                //         console.log('i',i)
                //         console.log(voc(stIndex + cosize[index]), voc(doc.y + cov(7)), cosize[index], cellHeight)
                //         s = { "x": stIndex, "y": 50, "w": cosize[index], "h": 20, "bd": border }
                //         console.log("x: ",s.x,"y: ",s.y,"w: ",s.w,"h: ",s.h)
                //         doc.rect(s['x'], cov(s['y']+2.5), s['w'], cov(s['h'])).stroke();
                //         stIndex += cosize[index]
                //     }
                //    i++
                // })
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                // doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: cosize,
            x: cov(20), y: doc.y
        });



        let DataTableB = [];
        for await (let X of AnyToon) {
            DataTableB.push(
                [
                    X.sp_name.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_year.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success1.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success2.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success3.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success4.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success5.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success5.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.sp_success5.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                ],
            )
        }
        
        const tableB = {
            title: "โปรดระบุข้อมูลความสำเร็จในการส่งเสริมและสนับสนุนนักศึกษาทุนตามสาขาวิชา/สาขางานที่นักศึกษาสำเร็จการศึกษา (การมีงานทำ ประกอบอาชีพอิสระ หรือการศึกษาต่อในระดับที่สูงขึ้น)",
            headers: [
                { label: "ปีที่รับทุน", headerAlign: "center", align: "center" },
                { label: "ประเภททุน", headerAlign: "center", align: "left" },
                { label: "หลักสูตร", headerAlign: "center", align: "left" },
                { label: "จำนวน\nนักศึกษา\nทุนสุทธิ*\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวน\nนักศึกษา\nทุนที่สำเร็จ\nการศึกษา\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวน\nผู้มีงานทำ\nหรือประกอบ\nอาชีพอิสระ\n(คน)", headerAlign: "center", align: "right" },
                { label: "จำนวน\nนักศึกษา\nต่อในระดับที่\nสูงขึ้น (คน)", headerAlign: "center", align: "right" },
                { label: "จำนวน\nผู้ศึกษา\nต่อในระดับที่\nสูงขึ้น (คน)", headerAlign: "center", align: "right" },
                { label: "จำนวนผู้ที่\nทำงานและ\nศึกษาต่อไป\nพร้อมกัน\n(คน)", headerAlign: "center", align: "right" },
                { label: "รายได้เฉลี่ยต่อ\nเดือนของผู้มี\nงานทำหรือ\nประกอบ\nอาชีพอิสระ\n(บาท)", headerAlign: "center", align: "right" },
            ],
            rows: DataTableB,
        };
        let cosizeB = [cov(20),cov(50),cov(50),cov(18),cov(18),cov(20),cov(20),cov(20),cov(25),cov(25)]
        doc.font(Bold).fontSize(12).fillColor('black');
        await doc.table(tableB, {
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black').stroke('black')
                // tableB.headers.forEach((header, index) => {
                //     const cellHeight = cov(19);   // ความสูงของเซลล์หัวตาราง
                //     if(i < tableB.headers.length){
                //         console.log('i',i)
                //         console.log(voc(stIndex + cosize[index]), voc(doc.y + cov(7)), cosize[index], cellHeight)
                //         s = { "x": stIndex, "y": 50, "w": cosize[index], "h": 20, "bd": border }
                //         console.log("x: ",s.x,"y: ",s.y,"w: ",s.w,"h: ",s.h)
                //         doc.rect(s['x'], cov(s['y']+2.5), s['w'], cov(s['h'])).stroke();
                //         stIndex += cosize[index]
                //     }
                //    i++
                // })
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                // doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: cosizeB,
            x: cov(20), y: doc.y
        });




        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};

export const PDF3 = async (req) => {
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = false;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(150), height: cov(s['h']), align: 'center' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(450), height: cov(s['h']), align: 'center' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }


        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('ส่วนที่ ๒ รายละเอียดโครงการ', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })
        


        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 170, "h": 6.5, "bd": border }
        doc.fontSize(14).font(Bold).fillColor("black").text('ส่วนที่ ๒ รายละเอียดโครงการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(84), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w'] - 66), cov(s['y'] + s['h'] - 2)).dash(1, { space: 0.01 }).stroke()
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("กลุ่มเป้าหมาย :", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('นักศึกษาทุนหลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล (ผู้รับทุน ไม่น้อยกว่า ๓๐ คน และไม่เกินกว่า ๑๕๐ คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();

        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('นักศึกษาทุนหลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์ (ผู้รับทุน ไม่น้อยกว่า ๓๐ คน และไม่เกินกว่า ๑๕๐ คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();

        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('นักศึกษาทุนหลักสูตรระยะสั้นประกาศนียบัตรพนักงานให้การดูแล (ผู้รับทุน จำนวน ๓๐ คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('(*กรณีสถานศึกษายื่นข้อเสนอทั้ง ๒ ประเภททุนหลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล และทุนหลักสูตรระยะสั้น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.56 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('ประกาศนียบัตรพนักงานให้การดูแลจำนวนผู้ขอรับทุนทั้งหมดไม่เกิน ๑๕๐ คนต่อสถานศึกษา)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        
        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สาขาวิชาที่สถานศึกษาเสนอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 125, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("สาขาที่ท่านเห็นว่ามีศักยภาพในการจัดการเรียนการสอน ทั้งนี้สามารถเสนอจำนวนหลักสูตรสาขา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.04 });
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ไม่เกิน ๒ สาขา โปรดระบุหลักสูตรสาขา ดังนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 61, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล ๑ ปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(25), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("จำนวน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 69, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน (ต้องได้การรับรองหลักสูตรจากสภาการพยาบาล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('และสถาบันการศึกษาที่มีหลักสูตรดังกล่าวต้องได้รับการรับรองให้จัดการเรียนการสอนเป็นเวลาไม่น้อยกว่า ๓ ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 56, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('๑. การสนับสนุนทุนเพิ่มเติมจากที่ กสศ. สนับสนุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 109, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("โดย กสศ. จะพิจารณาข้อเสนอโครงการของสถานศึกษาเป็นพิเศษากมีการร่วม", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.43 });
        doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
        s = { "x": 25, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สนับสนุนทุนและงบประมาณ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 }).undash();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ไม่มีสนับสนุนทุนเพิ่มเติม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('มีสนับสนุนทุนเพิ่มเติม จำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 }).undash();
       
        s = { "x": 25, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('กรณีที่มีสนับสนุนทุนเพิ่มเติม โปรดระบุแหล่งงบประมาณ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
       
        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุนการศึกษาของวิทยาลัย/มหาวิทยาลัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("สมาคมศิษย์เก่า", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(100), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("สมาคมผู้ปกครอง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(158), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สถานประกอบการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 14, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("อื่น ๆ ระบุ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(100), cov(s['y']), cov(4), cov(4)).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ลักษณะของการสนับสนุนทุนเพิ่มเติม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 }).undash();
       
        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุนเต็มจำนวนเทียบเท่ากับทุน กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();

        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุนไม่เต็มจำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สนับสนุนได้เป็นบางส่วน ได้แก่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ค่าธรรมเนียมการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(90), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ค่าใช้จ่ายรายเดือน เดือนละ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(90), cov(s['y']), cov(4), cov(4)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 43, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`บาท/ทุน`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 137, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        let coCc = 3
        for await (let dataI of [1,2,3,4]) {
            // if(coCc != 3){
                doc.addPage({
                    size: 'A4',
                    layout: `portrait`,
                    // layout: `landscape`,
                    margins: {
                        top: 50,
                        bottom: 0,
                        left: 72,
                        right: 72,
                    }
                })
            // }
            

            s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
            doc.font(Bold).fillColor("black").text(coCc +'.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("โปรดระบุหลักสูตรสาขาวิชา/สาขางาน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
            
            s = { "x": 25, "y": s['y'] + s['h'], "w": 45, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('สาขาที่ขาดแคลนด้านสายอาชีพ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(4), cov(4)).stroke();
            
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
            doc.font(Italic).fontSize(14).fillColor("black").text('(โปรดให้ข้อมูลรายละเอียดความขาดแคลนในสาขาในระดับพื้นที่)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            
            s = { "x": 25, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('•', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หลักสูตร หรือสาขาวิชา/สาขางานที่ขาดแคลนในท้องถิ่นหรือจังหวัดที่สถานศึกษาตั้งอยู่ อาจรวมถึงพื้นที่จังหวัดใกล้เคียง ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            s = { "x": 30, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('โดยการแสดงข้อมูลเหตุผลประกอบที่ชัดเจน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            
            s = { "x": 20, "y": s['y'] + s['h'], "w": 42, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปีที่ศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 63, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล 1 ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 28, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ณ ปี ๒๕๖๗ ในสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 28, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('คน จำนวนปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            
            s = { "x": 20, "y": s['y'] + s['h'], "w": 23, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ที่เปิดสอนมาแล้ว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปี จำนวนครูอาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            
            s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ระบุเฉพาะรายชื่อคณะอาจารย์ที่มีคุณวุฒิตรงกับสาขา ไม่เกิน ๕ ท่าน) รายละเอียดดังนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        
            let chkTbrow = 0
            let coTea = 1
            for await (let dataI of [1]) {
                console.log('s.y >>', s.y)
                if(s.y >= 200){
                    // doc.addPage({
                    //     size: 'A4',
                    //     layout: `portrait`,
                    //     // layout: `landscape`,
                    //     margins: {
                    //         top: 50,
                    //         bottom: 0,
                    //         left: 72,
                    //         right: 72,
                    //     }
                    // })
                    // s = { "x": 20, "y": 14.5, "w": 5, "h": 6.5, "bd": border }
                }
                // console.log("dataI", dataI)
                s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
                doc.font(Bold).fillColor("black").text(coCc +'.'+coTea+'.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor('black').text("ชื่อ-สกุล ครู/อาจารย์ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('วุฒิการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 21, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('สถาบันที่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 79, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            
                s = { "x": 25, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ปีที่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลาในการเป็นครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 111, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor("black").text('ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา*', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("     " + "I0100000", cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('วุฒิการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 21, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('สถาบันที่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 79, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            
                s = { "x": 25, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ปีที่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลาในการเป็นครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 111, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor("black").text('ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา*', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("     " + "I0100000", cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('วุฒิการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 21, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('สถาบันที่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 79, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            
                s = { "x": 25, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ปีที่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลาในการเป็นครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 111, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor("black").text('ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา*', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
                
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("     " + "I0100000", cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                
                coTea++
            }

            s = { "x": 20, "y": s['y'] + s['h']+5, "w": 111, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text("* สำหรับอาจารย์พิเศษ หรืออาจารย์ที่มีคุณวุฒิไม่สอดคล้องกับสาขา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash();
            
            s = { "x": 30, "y": s['y'] + s['h'], "w": 65, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์ ๑ ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            doc.lineJoin('miter').rect(cov(25), cov(s['y']), cov(4), cov(4)).stroke();
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('จำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('คน (ต้องได้รับการรับรองหลักสูตรจาก)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            s = { "x": 25, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ทันตแพทยสภา)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
            
            s = { "x": 25, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
            doc.font(Bold).fillColor("black").text("๑. การสนับสนุนทุนเพิ่มเติมจากที่ กสศ. สนับสนุน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 110, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('โดย กสศ. จะพิจารณาข้อเสนอโครงการของสถานศึกษาเป็นพิเศษ หากมีการร่วม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 });
           s = { "x": 25, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('กรณีที่มีสนับสนุนทุนเพิ่มเติม โปรดระบุแหล่งงบประมาณ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 }).undash();
       
        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุนการศึกษาของวิทยาลัย/มหาวิทยาลัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("สมาคมศิษย์เก่า", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(100), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("สมาคมผู้ปกครอง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(158), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สถานประกอบการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 14, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("อื่น ๆ ระบุ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(100), cov(s['y']), cov(4), cov(4)).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ลักษณะของการสนับสนุนทุนเพิ่มเติม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 }).undash();
       
        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุนเต็มจำนวนเทียบเท่ากับทุน กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();

        s = { "x": 38, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ทุนไม่เต็มจำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สนับสนุนได้เป็นบางส่วน ได้แก่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ค่าธรรมเนียมการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(90), cov(s['y']), cov(4), cov(4)).stroke();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 60, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ค่าใช้จ่ายรายเดือน เดือนละ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(90), cov(s['y']), cov(4), cov(4)).stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 43, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`บาท/ทุน`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        
        s = { "x": 38, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(4), cov(4)).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 137, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
           
            
            coCc++
        }



        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};


export const PDF4 = async (req) => {
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = true;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] ), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 290), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+50), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+100), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+150), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+200), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }


        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('4.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("วัตถุประสงค์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผลลัพธ์ ผลกระทบที่ต้องการให้เกิดขึ้นกับนักเรียน/นักศึกษาและสถานศึกษา)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
        s = { "x": 25, "y": s['y'] + s['h'], "w": 152, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('วัตถุประสงค์ของโครงการนี้ คือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('4.1) สร้างโอกาสที่เสมอภาคของเยาวชนผู้ขาดแคลนทุนทรัพย์และด้อยโอกาสให้ได้รับการศึกษาที่มีคุณภาพระดับสูง ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('กว่ามัธยมศึกษาตอนปลาย ตลอดจนส่งเสริมให้ผู้สำเร็จการศึกษาดังกล่าวสามารถมีงานทำ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
       
        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('4.2) ยกระดับคุณภาพสถานศึกษาในการผลิตกำลังคนสายอาชีพชั้นสูงให้ตอบสนองต่อความต้องการและ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เพิ่มขีดความสามารถทางการแข่งขันของประเทศตามแผนยุทธศาสตร์ประเทศไทย ๔.๐', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
       
        let io = 3
        for await (const p of [1,2,3]) {
            s = { "x": 20, "y": voc(doc.y), "w": 157, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text("     4."+io+") "+`I00011`, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.18 });
            io++
        }


        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};



export const PDF5 = async (req) => {
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = true;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] ), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 290), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+50), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+100), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+150), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+200), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }


        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('5.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 200, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("รายละเอียดสาขาที่สถานศึกษาเสนอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
        let  chkPage = 1
        for await (let X of [1,2,3,4]) {
            let DataTableA = [];
            if(chkPage != 1) {
                doc.addPage({
                    size: 'A4',
                    layout: `landscape`,
                    // layout: `landscape`,
                    margins: {
                        top: 50,
                        bottom: 0,
                        left: 72,
                        right: 72,
                    }
                })
            }
            DataTableA.push(
                [
                    "[ ] หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล",
                    "ได้รับการอนุมัติให้เปิดสอนในปี "+`I0000`+ "\nหน่วยงานที่อนุมัติหลักสูตร "+`I0000`,
                    "[ ] หลักสูตรปกติที่เปิดสอนโดยทั่วไป\n"+
                    "[ ] หลักสูตรที่มีการพัฒนากับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่ร่วม\n"+
                    `I0000`+
                    "\n     ( ) รัฐ     ( ) เอกชน     ( ) ท้องถิ่น"+
                    "\n( ) ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน โปรดระบุรายการที่ได้รับการสนับสนุน\n"+`     I0000`+
                    "\n( ) ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ"+
                    "\n[ ] หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษาระบุชื่อสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น " + `I0000`+"\n"+
                    "ผลลัพธ์ที่คาดหวังจากการทำความร่วมมือ "+ `I0000`
                ],
            )
            
            const tableA = {
                headers: [
                    { label: "ชื่อหลักสูตรที่รับการอนุมัติจาก\nหน่วยงานต้นสังกัดที่ต้องการ\nยื่นเสนอขอ", headerAlign: "center", align: "left" },
                    { label: "การอนุมัติหลักสูตร", headerAlign: "center", align: "left" },
                    { label: "หลักสูตร", headerAlign: "center", align: "left" },
                ],
                rows: DataTableA,
            };
            let cosize = [cov(50),cov(50),cov(160)]
            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            let i = 0
            let stIndex = cov(20)
            await doc.table(tableA, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black').stroke('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black').stroke('black')
                },
                columnsSize: cosize,
                x: cov(20), y: doc.y
            });



            chkPage++
        }


        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};


export const PDF6 = async (req) => {
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = true;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] ), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 290), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+50), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+100), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+150), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+200), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }


        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('6.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานที่ที่จะดำเนินการสอน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 200, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(แยกรายหลักสูตรสาขาที่ต้องการยื่นเสนอขอ) (ระบุสถานที่จัดการเรียนการสอน สถานศึกษา… ตำบล…อำเภอ…จังหวัด….)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        
            let DataTableA = [];
           
            DataTableA.push(
                [
                    "หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล",
                    "",
                    "",
                    "",
                    ""
                ],[
                    "หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์",
                    "",
                    "",
                    "",
                    ""
                ],[
                    "หลักสูตรระยะสั้นประกาศนียบัตรพนักงานให้การดูแล",
                    "",
                    "",
                    "",
                    ""
                ],
            )
            
            const tableA = {
                headers: [
                    { label: "ชื่อหลักสูตรสาขาที่เสนอ", headerAlign: "center", align: "left" },
                    { label: "ชื่อสถานที่จัดการเรียนการสอน", headerAlign: "center", align: "left" },
                    { label: "ตำบล", headerAlign: "center", align: "left" },
                    { label: "อำเภอ", headerAlign: "center", align: "left" },
                    { label: "จังหวัด", headerAlign: "center", align: "left" },
                ],
                rows: DataTableA,
            };
            let cosize = [cov(60),cov(110),cov(30),cov(30),cov(30)]
            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            let i = 0
            let stIndex = cov(20)
            await doc.table(tableA, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black').stroke('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black').stroke('black')
                },
                columnsSize: cosize,
                x: cov(20), y: doc.y
            });


        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};


export const PDF7 = async (req) => {
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = true;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] ), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 290), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+50), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+100), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+150), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+200), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }


        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('7.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 180, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานศึกษามีแนวทางในการพัฒนาระบบดูแลความเป็นอยู่และสวัสดิภาพของผู้เรียนให้สามารถเรียนจบตามกำหนดเวลาอย่างไร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.24 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 85, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ทั้งแนวทางและกลไกในการติดตามดูแล ป้องกัน เฝ้าระวัง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.07 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("และให้คำปรึกษาแก่ผู้รับทุน รวมถึงการประสานงานอย่างใกล้ชิดกับพ่อแม่ ผู้ปกครองตลอดระยะเวลาของการศึกษา รวมถึงแสดงวิธีการที่จะส่งเสริมคุณภาพชีวิตและการเรียนรู้ของผู้รับทุน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.39});
        s = { "x": 20, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("อย่างมีประสิทธิภาพทั้งด้านร่างกาย จิตใจ อารมณ์ และสังคม)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.39});
        s = { "x": 25, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('๗.๓.๑ การจัดหอพักและระบบดูแลที่ดีและเอื้อต่อการเรียนรู้ โดยคำนึงถึงราคาที่เหมาะสมและความปลอดภัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('๗.๓.๑.๑ สถานศึกษาของท่านสามารถจัดหอพักที่มีของสถานศึกษาสำหรับนักศึกษาผู้รับทุนของโครงการฯ เป็นการเฉพาะได้หรือไม่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        
        s = { "x": 35, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('มี เพียงพอกับจำนวนนักศึกษาทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(25), cov(s['y']), cov(5), cov(5)).stroke();
        
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('มี เพียงพอกับจำนวนนักศึกษาทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(105), cov(s['y']), cov(5), cov(5)).stroke();
       
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ไม่มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(185), cov(s['y']), cov(5), cov(5)).stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 85, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(โปรดระบุวิธีการบริหารจัดการด้านล่าง)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.07 });
        
                

            let DataTableA = [];
           
            DataTableA.push(
                [
                    "หอพักกลางของสถานศึกษา\n"+"[ ] หอพักรวม\n"+"[ ] หอชายล้วน\n"+"[ ] หอหญิงล้วน\n"+"[ ] อื่น ๆ โปรดระบุ "+`I000`+"\n",
                    "[ ] บ้านพัก\n"+"[ ] หอพัก จำนวน "+`I0000`+" ชั้น\n"+"[ ] ห้องน้ำในตัว\n"+"[ ] ห้องน้ำรวม\n"+"[ ] อื่น ๆ โปรดระบุ "+`I000`+"\n",
                    "",
                    "",
                ],
                [
                    "หอพักของสาขา\n"+"[ ] หอพักรวม\n"+"[ ] หอชายล้วน\n"+"[ ] หอหญิงล้วน\n"+"[ ] อื่น ๆ โปรดระบุ "+`I000`+"\n",
                    "[ ] บ้านพัก\n"+"[ ] หอพัก จำนวน "+`I0000`+" ชั้น\n"+"[ ] ห้องน้ำในตัว\n"+"[ ] ห้องน้ำรวม\n"+"[ ] อื่น ๆ โปรดระบุ "+`I000`+"\n",
                    "",
                    "",
                ],
                [
                    "ราคาค่าหอพัก/เดือน/คน ",
                    `I0000`+" บาท/เดือน/คน",
                    "",
                    "",
                ],
                [
                    "อื่น ๆ ระบุ",
                    "",
                    "",
                    "",
                ]
            )
            
            const tableA = {
                headers: [
                    { label: "ประเภทหอพัก", headerAlign: "center", align: "left" },
                    { label: "รายละเอียดหอพัก", headerAlign: "center", align: "left" },
                    { label: "จำนวนห้องที่รองรับผู้รับทุน(ปี ๒๕๖๘) (ห้อง)", headerAlign: "center", align: "left" },
                    { label: "จำนวนผู้รับทุน(ปี ๒๕๖๘) ที่รองรับได้ (คน)", headerAlign: "center", align: "left" },
                ],
                rows: DataTableA,
            };
            let cosize = [cov(65),cov(65),cov(65),cov(65)]
            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            let i = 0
            let stIndex = cov(20)
            await doc.table(tableA, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black').stroke('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black').stroke('black')
                },
                columnsSize: cosize,
                x: cov(20), y: doc.y + 12
            });

            s = { "x": 20, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
            doc.font(Italic).fontSize(14).fillColor('black').text("โปรดระบุ : หอพัก ๑ ห้อง จะสามารถจัดให้ผู้รับทุนอาศัยอยู่ได้ จำนวน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0});
            doc.moveTo(cov(20), cov(s['y'] + s['h'] - 1)).lineTo(cov(35), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0041`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 73, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("คน อาจารย์ผู้ดูแลหอพัก สัดส่วน ครู : ผู้รับทุนในหอพัก", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0041`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 2, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(":", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0041`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            
            s = { "x": 20, "y": voc(doc.y), "w": 190, "h": 6.5, "bd": border }
            doc.font(Italic).fontSize(14).fillColor('black').text("โปรดแนบแผนผังและภาพถ่ายหอพักนักศึกษา และประกาศอัตราการเรียกเก็บค่าเช่าหอพักและค่าสาธารณูปโภค ระยะทางจากหอพักถึงสถานศึกษา …………. กิโลเมตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0});
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`I0041`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(`กิโลเมตร`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            

        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};





export const PDFAprrove = async (req) => {

    try {

        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';



        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const pipeLine = false;
        if(pipeLine){
            let testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": testFooter+=10, "y": 0, "w": 10, "h": 300, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] ), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 75), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 150), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 225), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y'] + 290), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
            testFooter = -10
            for (let fi =0 ; fi <= 30; fi++){
                s = { "x": 0, "y": testFooter+=10, "w": 300, "h": 10, "bd": border }
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+50), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+100), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+150), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.font(ThS).fillColor("#black").text(`${testFooter}`, cov(s['x']+200), cov(s['y']), { width: cov(10), height: cov(s['h']), align: 'left' });
                doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).dash(1, { space: 1.5 }).stroke("#c4c2c2");
            }
        }

        doc.lineWidth(0).stroke('black');
        s = { "x": 20, "y": 20, "w": 170, "h": 8, "bd": border }
        doc.fontSize(14).font(Bold).fillColor("black").text('ส่วนที่ ๓ คำรับรอง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(92), cov(s['y'] + s['h'] - 3.5)).lineTo(cov(s['x'] + s['w'] - 72), cov(s['y'] + s['h'] - 3.5)).dash(1, { space: 0.01 }).stroke()
        
        s = { "x": 30, "y": s['y'] + s['h']+5, "w": 12, "h": 8, "bd": border }
        doc.font(ThS).fillColor("black").text('ข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 137, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0100`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`ได้ศึกษา`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ประกาศสำนักงาน กสศ. เรื่อง เปิดรับโครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา ๒๕๖๗ รวมถึงแนวทางและเงื่อนไข', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.32 }).undash();
       
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('การสนับสนุนการดำเนินงานโครงการของ กสศ. โดยละเอียดแล้ว และขอรับรองว่า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
       
        s = { "x": 30, "y": s['y'] + s['h']+5, "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๑) ข้อความ ข้อมูล และรายละเอียดต่าง ๆ ที่ข้าพเจ้าได้ให้ไว้ในแบบเสนอโครงการเป็นความจริง ทุกประการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.67 }).undash();
       
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ซึ่งหากระหว่างการพิจารณาคัดเลือกข้อเสนอโครงการนี้กสศ. ตรวจพบว่ามีข้อความ ข้อมูล หรือ รายละเอียดต่าง ๆอื่นใดเป็นเท็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.185 }).undash();
       
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('หรือปกปิดข้อความจริงอันควรแจ้งให้ทราบ โครงการจะไม่ได้รับการพิจารณาและในกรณีมีการอนุมัติและเบิกจ่ายเงิน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.63 }).undash();
       
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ให้แก่โครงการแล้วข้าพเจ้าจะชำระเงินดังกล่าวคืนให้แก่ กสศ. เต็มจำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
       

        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๒) แบบข้อเสนอโครงการนี้ จัดทำขึ้นเพื่อขอรับทุนการสนับสนุนจาก กสศ. เป็นการเฉพาะ ไม่ได้ทำขึ้นเพื่อขอรับการสนับสนุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('งบประมาณจากรัฐ เอกชน หรือหน่วยงานอื่นใดในลักษณะรายการของบประมาณซ้ำซ้อน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.185 }).undash();
       
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๓) ขอรับรองว่าแบบเสนอโครงการไม่ได้เกิดจากการคัดลอก ดัดแปลง เอกสารที่เป็นลิขสิทธิ์ใดๆ อย่างไม่ถูกต้องตามกฎหมาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.04 }).undash();
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๔) ผลงาน เอกสาร และข้อมูลอื่นใด ที่ข้าพเจ้าส่งมอบให้แก่ กสศ. ทั้งหมดเป็นกรรมสิทธิ์ตามกฎหมายโดยชอบของ กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 }).undash();
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๕) ข้าพเจ้าได้ตรวจสอบความถูกต้อง ครบถ้วน ของเอกสารเพื่อนำส่งแบบเสนอโครงการตามรายการเอกสารด้านล่าง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.35 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อย่างครบถ้วนแล้ว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.185 }).undash();
       
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๖) ข้าพเจ้ายอมรับผลการพิจารณาแบบเสนอโครงการของ กสศ. และยอมรับว่าการพิจารณาตัดสินของ กสศ. ถือเป็นที่สุด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 }).undash();
       
       
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๗) ข้าพเจ้ารับทราบและยินยอมให้ กสศ. และ/หรือ นิติบุคคลที่ได้รับมอบหมาย บันทึกข้อมูลและใช้ข้อมูลของข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.26 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ในการทำธุรกรรมและ/หรือ การใช้บริการของข้าพเจ้า เพื่อประโยชน์ในการ ให้บริการแก่ข้าพเจ้า และ/หรือ เพื่อประโยชน์อื่นใด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ที่ข้าพเจ้าได้ให้ความยินยอมไว้แก่ กสศ. รวมถึงเพื่อการวิเคราะห์ข้อมูล เสนอให้ใช้ และ/หรือ ปรับปรุงกระบวนการหรือบริการอื่น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('นอกจากนี้ กสศ. อาจใช้ข้อมูลของ ข้าพเจ้าเพื่อการปฏิบัติตามกฎระเบียบต่าง ๆของ กสศ. ข้าพเจ้ามีสิทธิ์ในความเป็นส่วนตัวในข้อมูล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.03 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ของข้าพเจ้าเพื่อการปฏิบัติตามกฎระเบียบต่าง ๆ ของ กสศ. ข้าพเจ้ามีสิทธิ์ในความเป็นส่วนตัวในข้อมูลของข้าพเจ้า กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.43 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('จากข้าพเจ้าตามวัตถุประสงค์ดังกล่าวข้างต้น จะเป็นไปเพื่อประโยชน์แก่ข้าพเจ้าและไม่เป็นการแสวงหาผลกำไรจากการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ใช้ข้อมูลดังกล่าวและ กสศ.จะไม่เปิดเผยข้อมูลของข้าพเจ้า ให้แก่บุคคล และ/หรือ นิติบุคคลอื่น เว้นแต่ในกรณีดังต่อไปนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
       
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('-    การเปิดเผยข้อมูลให้แก่บุคลากรผู้ที่ได้รับอนุญาตจาก กสศ. ซึ่ง ได้แก่ บุคลากรในส่วนงานของ กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('-    การเปิดเผยข้อมูลดังกล่าวเป็นไปเพื่อปฏิบัติตามกฎหมาย เพื่อการสอบสวนหรือการดำเนินการทางกฎหมาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('-    การเปิดเผยข้อมูลดังกล่าวเป็นไปตามกฎหมายหรือตามคำสั่งของ หน่วยงานรัฐ หรือหน่วยงานกำกับดูแล กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('-    การเปิดเผยข้อมูลให้แก่บุคคล และ/หรือ นิติบุคคล ที่ กสศ. ได้รับความยินยอมจากข้าพเจ้าตามวัตถุประสงค์ดังกล่าว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 }).undash();
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('     ข้างต้นจะเป็นไปเพื่อประโยชน์แก่ข้าพเจ้าและไม่เป็นการแสวงหาผลกำไร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.04 }).undash();
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๘) การยื่นข้อเสนอตามโครงการนี้ ไม่ก่อให้ข้าพเจ้ามีสิทธิเรียกร้องค่าธรรมเนียม ค่าเสียหาย หรือค่าใช้จ่ายอื่นใด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.47 }).undash();
        
        s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๙) ข้าพเจ้าจะเรียกเก็บค่าธรรมเนียมการศึกษาตามหลักสูตรจาก กสศ. เท่านั้น และห้ามสถานศึกษาเรียกเก็บค่าธรรมเนียม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('การศึกษาจากนักศึกษาผู้รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 }).undash();
        


        doc.addPage({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })
    
        s = { "x": 30, "y": 20, "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(๑๐) ผู้บริหาร ผู้รับผิดชอบโครงการ คณะทำงาน ตลอดจนบุคลากรของสถานศึกษาทุกคน ได้ทำความเข้าใจในประกาศ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.27 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('และกฎระเบียบ/หลักเกณฑ์ที่เกี่ยวข้องในการดำเนินงานของ กสศ. และข้อเสนอโครงการฯ ของสถานศึกษาที่เสนอต่อ กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อย่างชัดเจนพร้อมจะดำเนินการตามเงื่อนไข ข้อเสนอแนะ และข้อปรับปรุง ของกสศ. และคณะหนุนเสริม เพื่อยกระดับคุณภาพ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.23 }).undash();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ของโครงการฯ และสถานศึกษาจะดำเนินการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 }).undash();
        

        s = { "x": 120, "y": s['y'] + s['h']+20, "w": 8, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 }).undash();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 120, "y": s['y'] + s['h'], "w": 8, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right', characterSpacing: 0.37 }).undash();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`)`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 128, "y": s['y'] + s['h'], "w": 62, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('หัวหน้าโครงการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.37 }).undash();
        

        s = { "x": 120, "y": s['y'] + s['h']+10, "w": 8, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 }).undash();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 120, "y": s['y'] + s['h'], "w": 8, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right', characterSpacing: 0.37 }).undash();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`)`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 128, "y": s['y'] + s['h'], "w": 62, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ผู้รับผิดชอบโครงการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.37 }).undash();
        

        s = { "x": 120, "y": s['y'] + s['h']+10, "w": 8, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 }).undash();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 120, "y": s['y'] + s['h'], "w": 8, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right', characterSpacing: 0.37 }).undash();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`I0005`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(`)`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 128, "y": s['y'] + s['h'], "w": 62, "h": 8, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ผู้บริหารสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.37 }).undash();
        

        // 
        // 
        //  
        // 


        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
    }
};





//-------------------------- คำรับรองห้ามแก้ --------------------------//
export const PdfSp1 = async (req, res) => {
    const u_id = req.params.u_id
    const u_type = req.params.u_type
    const u_type2 = req.params.u_type2
    const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await PDF14(data);
    res.send("data:application/pdf;base64," + pdfBase64)
}
//-------------------------- คำรับรองห้ามแก้ --------------------------//



export const TestPdf2025 = async (req, res) => {
    // const u_id = req.params.u_id
    // const u_type = req.params.u_type
    // const u_type2 = req.params.u_type2
    // const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await PDFAprrove("data");
    res.send("<iframe width='100%' download='browser.pdf' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
}


// export const PdfSp1 = async (req, res) => {
// console.log("xxxxxxxxxxxxxxxxxx", req.body)
//     const pdfBase64 = await PDF(req.body);
//     res.send("data:application/pdf;base64," + pdfBase64 + "")
// }

