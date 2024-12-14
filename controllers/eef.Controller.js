import axios from "axios";
import mysql from "mysql2";
import pool from '../config/connect_eef.js';

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


// export const Pdf1 = async (req, res) => {

// }


const run = async (req, res) => {
    const pdfBase64 = await genDoc();
    // console.log(pdfBase64)
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

const getData = async (u_id, u_type, u_type1) => {
    let Objs = {
        "Types": u_type1,
        "TypesPee": u_type,
        "Main": [],
        "Person": {
            "Major": [],
            "Ceo": [],
            "Project": [],
            "Manage": [],
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
        const sqls = `SELECT * FROM innovet_2024_school_info a INNER JOIN innovet_2024_school b ON a.u_id = b.s_id WHERE a.u_id = '${u_id}' `
        const resMerchant = await connection.query(sqls)
        if (resMerchant.length > 0) {
            Objs['Main'] = resMerchant[0];
        }
        const sqlUsers = `SELECT * FROM innovet_2024_user WHERE u_id = '${u_id}' `
        // console.log(sqlUsers)
        const resUsers = await connection.query(sqlUsers)
        if (resUsers.length > 0) {
            Objs['Users'] = resUsers[0];
        }
        const sqlCeo = `SELECT * FROM innovet_2024_personal WHERE p_type = '${u_type}' AND u_id = '${u_id}'`
        const resCeo = await connection.query(sqlCeo)
        if (resCeo.length > 0) {
            for await (const D of resCeo[0]) {
                Objs['Person'][typeData[D.p_section]] = D;
            }
        }
        const sqlMainCeo = `SELECT *  FROM innovet_2024_personal WHERE p_section = 'ผู้บริหารสถานศึกษา' AND u_id = '${u_id}'`
        const resMainCeo = await connection.query(sqlMainCeo)
        if (resMainCeo.length > 0) {
            Objs['Person']['Ceo'] = resMainCeo[0][0];
        }
        const sqlProblem = `SELECT * FROM innovet_2024_objective WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        const resProblem = await connection.query(sqlProblem)
        if (resProblem.length > 0) {
            Objs['Problem'] = resProblem[0];
        }
        // major
        // major_detail

        const sqlMajor = `SELECT * , '' as teacher , '' as Approve FROM innovet_2024_major a LEFT JOIN innovet_2024_major_detail b ON a.m_id = b.m_id WHERE a.u_id = '${u_id}' AND a.u_type = '${u_type}'`
        const [resMajor] = await connection.query(sqlMajor)
        if (resMajor.length > 0) {
            // console.log(resMajor)
            Objs['Major'] = resMajor;
        }
        // console.log(Objs)
        let chk = 0
        for await (const i of Objs['Major']) {
            Objs['Major'][chk]['teacher'] = []
            let sqlSubTeacher = `SELECT * FROM innovet_2024_major_teacher WHERE m_id = '${i.m_id}' AND u_type = '${u_type}' AND u_id = '${u_id}'`
            const [resSubTeacher] = await connection.query(sqlSubTeacher)
            if (resSubTeacher.length > 0) {
                Objs['Major'][chk]['teacher'] = resSubTeacher
            }
            Objs['Major'][chk]['Approve'] = []
            let sqlSubApprove = `SELECT * FROM innovet_2024_major_approve WHERE m_id = '${i.m_id}' AND u_type = '${u_type}' AND u_id = '${u_id}'`
            const [resSubApprove] = await connection.query(sqlSubApprove)
            if (resSubApprove.length > 0) {
                Objs['Major'][chk]['Approve'] = resSubApprove
            }

            Objs['Major'][chk]['Follow'] = []
            let sqlFollow = `SELECT * FROM innovet_2024_major_height WHERE m_id = '${i.m_id}' AND u_type = '${u_type}' AND u_id = '${u_id}'`
            const [resFollow] = await connection.query(sqlFollow)
            if (resFollow.length > 0) {
                Objs['Major'][chk]['Follow'] = resFollow
            }
            chk++
        }

        const sqlDorm = `SELECT * FROM innovet_2024_dorm_check WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        // console.log(sqlDorm)
        const [resDorm] = await connection.query(sqlDorm)
        if (resDorm.length > 0) {
            Objs['Dorm'] = resDorm;
        }

        const sqlDormSub = `SELECT * FROM innovet_2024_dorm WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        // console.log(sqlDormSub)
        const [resDormSub] = await connection.query(sqlDormSub)
        if (resDormSub.length > 0) {
            Objs['DormSub'] = resDormSub;
        }


        const sqlSupReflect = `SELECT a.* , b.m_major, b.m_work FROM innovet_2024_support_reflect a INNER JOIN innovet_2024_major b ON a.m_id = b.m_id WHERE a.u_type = '${u_type}' AND a.u_id = '${u_id}'`
        // console.log(sqlSupReflect)
        const [resSupReflect] = await connection.query(sqlSupReflect)
        if (resSupReflect.length > 0) {
            Objs['SupReflect'] = resSupReflect;
        }

        const sqlSupReflectOth = `SELECT * FROM innovet_2024_support_reflect_oth WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        // console.log(sqlSupReflectOth)
        const [resSupReflectOth] = await connection.query(sqlSupReflectOth)
        if (resSupReflectOth.length > 0) {
            Objs['SupReflectOth'] = resSupReflectOth;
        }

        const sqlArea = `SELECT a.*, b.m_major, b.m_work FROM innovet_2024_teach_place a INNER JOIN innovet_2024_major b ON a.m_id = b.m_id WHERE a.u_id = '${u_id}' AND b.u_type = '${u_type}'`
        const [resArea] = await connection.query(sqlArea)
        if (resArea.length > 0) {
            Objs['Area'] = resArea;
        }

        const sqlAreaHeight = `SELECT a.*, b.mh_major, b.mh_work FROM innovet_2024_teach_place_height a INNER JOIN innovet_2024_major_height b ON a.mh_id = b.mh_id WHERE a.u_id = '${u_id}' AND b.u_type = '${u_type}'`
        // console.log(sqlAreaHeight)
        const [resAreaHeight] = await connection.query(sqlAreaHeight)
        if (resAreaHeight.length > 0) {
            Objs['AreaHeight'] = resAreaHeight;
        }

        const sqlAnyToon = `SELECT * FROM innovet_2024_support WHERE sp_section = 'ทุนอื่น' AND u_id = '${u_id}' AND u_type = '${u_type}'`
        const [resAnyToon] = await connection.query(sqlAnyToon)
        if (resAnyToon.length > 0) {
            Objs['AnyToon'] = resAnyToon;
        }
        const sqlToon = `SELECT * FROM innovet_2024_support WHERE sp_section = 'ทุนนวัตกรรม' AND (u_id = '${u_id}' OR sp_school = '${Objs['Users'][0]['u_school']}') AND u_type = '${u_type}'`
        const [resToon] = await connection.query(sqlToon)
        if (resToon.length > 0) {
            Objs['Toon'] = resToon;
        }
        const sqlSuportChk = `SELECT * FROM innovet_2024_support_check WHERE u_id = '${u_id}' AND u_type = '${u_type}'`
        const [resSuportChk] = await connection.query(sqlSuportChk)
        if (resSuportChk.length > 0) {
            Objs['SuportChk'] = resSuportChk;
        }


        const sqlTotalFund = `SELECT SUM(m_fund) AS TotalFund FROM innovet_2024_major WHERE u_id = '${u_id}' AND u_type = '${u_type}'`
        const [resTotalFund] = await connection.query(sqlTotalFund)
        if (resTotalFund.length > 0) {
            Objs['TotalFund'] = resTotalFund;
        }
        // console.log(sqlAnyToon)
        // console.log(sqlToon)
        // console.log(sqlSuportChk)


        const sqlProduct = `SELECT * FROM innovet_2024_product WHERE pd_section = 'ผลผลิต' AND u_id = '${u_id}'  AND u_type = '${u_type}'`
        const [resProduct] = await connection.query(sqlProduct)
        if (resProduct.length > 0) {
            Objs['Product'] = resProduct;
        }
        const sqlProduct2 = `SELECT * FROM innovet_2024_product WHERE pd_section = 'ผลลัพธ์' AND u_id = '${u_id}'  AND u_type = '${u_type}'`
        const [resProduct2] = await connection.query(sqlProduct2)
        if (resProduct2.length > 0) {
            Objs['Product2'] = resProduct2;
        }
        const sqlManage = `SELECT * FROM innovet_2024_manage WHERE u_type = '${u_type}' AND u_id = '${u_id}' `
        const [resManage] = await connection.query(sqlManage)
        if (resManage.length > 0) {
            Objs['Manage'] = resManage;
        }
        const sqlCourse = `SELECT a.* , b.m_major , b.m_work   FROM innovet_2024_course a INNER JOIN innovet_2024_major b ON a.m_id = b.m_id WHERE a.u_type = '${u_type}' AND a.u_id = '${u_id}' `
        const [resCourse] = await connection.query(sqlCourse)
        if (resCourse.length > 0) {
            Objs['Course'] = resCourse;
        }

        if (u_type == '5') {
            const sqlCourseHeigh = `SELECT a.*, b.*, a.mh_id as major_id  FROM innovet_2024_major_height a LEFT JOIN innovet_2024_course_height b ON a.mh_id = b.mh_id WHERE  a.u_type = '${u_type}' AND a.u_id = '${u_id}' `
            const [resCourseHeigh] = await connection.query(sqlCourseHeigh)
            if (resCourseHeigh.length > 0) {
                Objs['CourseHeigh'] = resCourseHeigh;
            }
        }
        const sqlFiles = `SELECT  concat('https://eefinnovet.com/',f_folder2) as f_folder2,u_section FROM innovet_2024_files WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        const [resFiles] = await connection.query(sqlFiles)
        if (resFiles.length > 0) {
            Objs['Files'] = {}
            for await (const i of resFiles) {
                Objs['Files'][i.u_section] = i.f_folder2
            }
        }


        const sqlMarkerUp = `SELECT * FROM innovet_2024_marker WHERE u_type = '${u_type}' AND u_id = '${u_id}' AND mk_data != '' `
        const [resMarkerUp] = await connection.query(sqlMarkerUp)
        if (resMarkerUp.length > 0) {
            Objs['MarkerUp'] = resMarkerUp;
        }
        const sqlMarkerDown = `SELECT * FROM innovet_2024_marker WHERE u_type = '${u_type}' AND u_id = '${u_id}'  AND mk_data = '' `
        const [resMarkerDown] = await connection.query(sqlMarkerDown)
        if (resMarkerDown.length > 0) {
            Objs['MarkerDown'] = resMarkerDown;
        }

        // 
        return Objs
    } catch (error) {
        console.log(error)
        return false
    }
}

export const PDF1 = async (req) => {

    const MainData = req['Main'][0]
    const MajorData = req['Person']['Major']
    const CeoData = req['Person']['Ceo']
    const ProjectData = req['Person']['Project']
    const ManageData = req['Person']['Manage']
    const EmpData = req['Person']['Emp']
    const Types = req['Types']
    const TypesPee = req['TypesPee']
    const Users = req['Users']['0']

    let ceo_prefix = CeoData.p_prefix
    let ceo_prefixname_oth = CeoData.p_prefix_oth
    let ceo_name = CeoData.p_firstname
    let ceo_surname = CeoData.p_lastname
    let ceo_id = CeoData.p_idcard
    let ceo_address = CeoData.p_address
    let ceo_tambon = CeoData.p_district
    let ceo_amphur = CeoData.p_amphur
    let ceo_province = CeoData.p_province
    let ceo_postcode = CeoData.p_zipcode
    let ceo_tel = CeoData.p_tel
    let ceo_email = CeoData.p_email
    let ceo_line = CeoData.p_lineid
    let ceo_period = CeoData.p_time
    let ceo_day = CeoData.p_day
    let ceo_month = CeoData.p_month
    let ceo_year = CeoData.p_year
    let ceo_exp = CeoData.p_experience
    let ceo_exp_time = CeoData.p_experience_oth
    let ceo_work_at1 = CeoData.p_work_at1
    let ceo_work_at2 = CeoData.p_work_at2
    let ceo_work_at2_oth = CeoData.p_work_at2_oth

    // ผู้บริหารคณะ
    const d_prefix = MajorData['p_prefix'] == null ? "" : MajorData['p_prefix']
    const d_prefixname_oth = MajorData['p_prefix_oth'] == null ? "" : MajorData['p_prefix_oth']
    const d_name = MajorData['p_firstname'] == null ? "" : MajorData['p_firstname']
    const d_surname = MajorData['p_lastname'] == null ? "" : MajorData['p_lastname']
    const d_id = MajorData['p_idcard'] == null ? "" : MajorData['p_idcard']
    const d_address = MajorData['p_address'] == null ? "" : MajorData['p_address']
    const d_tambon = MajorData['p_district'] == null ? "" : MajorData['p_district']
    const d_amphur = MajorData['p_amphur'] == null ? "" : MajorData['p_amphur']
    const d_province = MajorData['p_province'] == null ? "" : MajorData['p_province']
    const d_postcode = MajorData['p_zipcode'] == null ? "" : MajorData['p_zipcode']
    const d_tel = MajorData['p_tel'] == null ? "" : MajorData['p_tel']
    const d_email = MajorData['p_email'] == null ? "" : MajorData['p_email']
    const d_line = MajorData['p_lineid'] == null ? "" : MajorData['p_lineid']
    const d_period = MajorData['p_time'] == null ? "" : MajorData['p_time']
    const d_day = MajorData['p_day'] == null ? "" : MajorData['p_day']
    const d_month = MajorData['p_month'] == null ? "" : MajorData['p_month']
    const d_year = MajorData['p_year'] == null ? "" : MajorData['p_year']
    const d_exp = MajorData['p_experience'] == null ? "" : MajorData['p_experience']
    const d_exp_time = MajorData['p_experience_oth'] == null ? "" : MajorData['p_experience_oth']
    const d_position = MajorData['p_position'] == null ? "" : MajorData['p_position']
    const d_branch = MajorData['p_branch'] == null ? "" : MajorData['p_branch']
    const d_work_at1 = MajorData['p_work_at1'] == null ? "" : MajorData['p_work_at1']
    const d_work_at2 = MajorData['p_work_at2'] == null ? "" : MajorData['p_work_at2']
    const d_work_at2_oth = MajorData['p_work_at2_oth'] == null ? "" : MajorData['p_work_at2_oth']

    // ผู้รับผิดชอบโครงการ
    const res_prefix = ManageData['p_prefix']
    const res_prefixname_oth = ManageData['p_prefix_oth']
    const res_name = ManageData['p_firstname']
    const res_surname = ManageData['p_lastname']
    const res_id = ManageData['p_idcard']
    const res_address = ManageData['p_address']
    const res_tambon = ManageData['p_district']
    const res_amphur = ManageData['p_amphur']
    const res_province = ManageData['p_province']
    const res_postcode = ManageData['p_zipcode']
    const res_tel = ManageData['p_tel']
    const res_email = ManageData['p_email']
    const res_line = ManageData['p_lineid']
    const res_period = ManageData['p_time']
    const res_day = ManageData['p_day']
    const res_month = ManageData['p_month']
    const res_year = ManageData['p_year']
    const res_exp = ManageData['p_experience']
    const res_exp_time = ManageData['p_experience_oth']
    const res_position = ManageData['p_position']
    const res_branch = ManageData['p_branch']
    const res_level_couse1 = ManageData['p_level_certi1']
    const res_level_couse2 = ManageData['p_level_certi2']
    const res_level_couse3 = ManageData['p_level_certi3']
    const res_level_couse4 = ManageData['p_level_certi_high1']
    const res_level_couse5 = ManageData['p_level_certi_high2']
    const res_level_couse6 = ManageData['p_level_anu1']
    const res_level_couse7 = ManageData['p_level_anu2']
    const res_level_couse8 = ManageData['p_level_oth']
    const res_level_couse8_oth = ManageData['p_level_assign']
    const res_level_couse9 = ManageData['p_level_bachelor']
    const res_level_couse10 = ManageData['p_level_master_degree']
    const res_level_couse11 = ManageData['p_level_doctoral_degree']
    const res_level_couse12 = ManageData['p_level_certi1y']
    const res_work_at1 = ManageData['p_work_at1']
    const res_work_at2 = ManageData['p_work_at2']
    const res_work_at2_oth = ManageData['p_work_at2_oth']

    // เจ้าหน้าที่การเงินโครงการ

    const fn_prefix = EmpData['p_prefix'];
    const fn_prefixname_oth = EmpData['p_prefix_oth'];
    const fn_name = EmpData['p_firstname'];
    const fn_surname = EmpData['p_lastname'];
    const fn_id = EmpData['p_idcard'];
    const fn_address = EmpData['p_address'];
    const fn_tambon = EmpData['p_district'];
    const fn_amphur = EmpData['p_amphur'];
    const fn_province = EmpData['p_province'];
    const fn_postcode = EmpData['p_zipcode'];
    const fn_tel = EmpData['p_tel'];
    const fn_email = EmpData['p_email'];
    const fn_line = EmpData['p_lineid'];
    const fn_period = EmpData['p_time'];
    const fn_day = EmpData['p_day'];
    const fn_month = EmpData['p_month'];
    const fn_year = EmpData['p_year'];
    const fn_exp = EmpData['p_experience'];
    const fn_exp_time = EmpData['p_experience_oth'];
    const fn_position = EmpData['p_position'];
    const fn_branch = EmpData['p_branch'];
    const fn_work_at1 = EmpData['p_work_at1'];
    const fn_work_at2 = EmpData['p_work_at2'];
    const fn_work_at2_oth = EmpData['p_work_at2_oth'];

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


        doc.font(Bold).fontSize(16).fillColor('black');

        doc.lineJoin('round')
            .roundedRect(cov(20), cov(20), cov(170), cov(34), cov(5))
            .stroke();


        s = { "x": 20, "y": 27, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('แบบเสนอ “' + (Types == 'ทั่วไป' ? '' : 'สถานศึกษานวัตกรรม ภายใต้') + 'โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปี 2567”', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        if (TypesPee == 1) {
            s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
            doc.fillColor("black").text('(ทุน 1 ปี หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล/ผู้ช่วยทันตแพทย์) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        } else if (TypesPee == 2) {
            s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
            doc.fillColor("black").text('(ทุน 2 ปี ปวส./อนุปริญญา)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        } else if (TypesPee == 5) {
            s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
            doc.fillColor("black").text('(ทุน 5 ปี ปวช. ต่อเนื่อง ปวส.) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        }
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('กองทุนเพื่อความเสมอภาคทางการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });


        s = { "x": 20, "y": s['y'] + s['h'] + 10, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('คำอธิบาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ก่อนจัดทำแบบเสนอโครงการ สถานศึกษาควรศึกษาประกาศสำนักงานกองทุนเพื่อความเสมอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.35 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 35, "y": s['y'] + s['h'], "w": 155, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ภาคทางการศึกษา เรื่อง เปิดรับข้อเสนอโครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปี 2567 อย่าง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.65 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 35, "y": s['y'] + s['h'], "w": 110, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ละเอียด และยื่นแบบเสนอโครงการ ผ่านระบบออนไลน์ที่เว็บไซต์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.8 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("https://eefinnovet.com", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.7 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()

        s = { "x": 35, "y": s['y'] + s['h'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("โดยกรอกข้อมูลและส่งเอกสารตามกำหนดให้ครบถ้วน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 40, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("แบบเสนอโครงการการส่งเสริมนักเรียนที่ขาดแคลนทุนทรัพย์และด้อยโอกาสให้ได้รับการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 35, "y": s['y'] + s['h'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ต่อสายอาชีพชั้นสูง ในโครงการทุนนวัตกรรมสายอาชีพชั้นสูง ประกอบด้วย 3 ส่วน ได้แก่ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 40, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ส่วนที่ 1 ข้อมูลทั่วไป ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 40, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ส่วนที่ 2 รายละเอียดโครงการ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 40, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ส่วนที่ 3 คำรับรอง ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 40, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('3.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("สถานศึกษาควรศึกษาเอกสาร และกรอกข้อมูลให้ครบถ้วนชัดเจนเพื่อประโยชน์ต่อการพิจารณา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.22 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 35, "y": s['y'] + s['h'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("และตรวจสอบความถูกต้องของเอกสารก่อนการยื่นข้อเสนอโครงการผ่านระบบออนไลน์ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }




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
        doc.font(ThS).fillColor("black").text('การยื่นแบบเสนอโครงการขอให้ผ่านระบบออนไลน์ที่เว็บไซต์ https://eefinnovet.com', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(129), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 21), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่วันที่ 23 ธันวาคม 2566 – 9 มกราคม 2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('สอบถามข้อมูลเพิ่มเติม  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('   โทร. 02-079-5475 กด 2 ในวันและเวลาราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        doc.addPage()


        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไปdadsdada', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



        doc.addPage()



        doc.lineWidth(0).stroke();

        s = { "x": 20, "y": 20, "w": 170, "h": 6.5, "bd": border }
        doc.fontSize(14).font(Bold).fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไปdasdsda', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(89), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w'] - 69), cov(s['y'] + s['h'] - 2)).dash(1, { space: 0.01 }).stroke()



        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ชื่อโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        if (Types != 'นวัตกรรม') {
            if (TypesPee == 1) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)") {
                    doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา 2567 ประเภททุน 1 ปี หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
                } else if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์)") {
                    doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา 2567 ประเภททุน 1 ปี หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์ ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
                }
            } else if (TypesPee == 2) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา 2567 ประเภททุน 2 ปี (ปวส./อนุปริญญา) ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 1.13 });
            } else if (TypesPee == 5) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา 2567 ประเภททุน 5 ปี (ปวช. ต่อเนื่อง ปวส.) ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.95 });
            }
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        } else {
            if (TypesPee == 1) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)") {
                    doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ประเภทสถานศึกษานวัตกรรม ปีการศึกษา 2567 ประเภททุน 1 ปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.91 });
                    s = { "x": 25, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
                    doc.font(ThS).fontSize(14).fillColor("black").text('หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
                } else if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์)") {
                    doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ประเภทสถานศึกษานวัตกรรม ปีการศึกษา 2567 ประเภททุน 1 ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.8 });
                    s = { "x": 25, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
                    doc.font(ThS).fontSize(14).fillColor("black").text('หลักสูตรประกาศนียบัตรช่วยทันตแพทย์ ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
                }
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 105, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            } else if (TypesPee == 2) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ประเภทสถานศึกษานวัตกรรม ปีการศึกษา 2567 ประเภททุน 2 ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.8 });
                s = { "x": 25, "y": s['y'] + s['h'], "w": 35, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('(ปวส./อนุปริญญา) ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 125, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            } else if (TypesPee == 5) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 180, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('โครงการทุนนวัตกรรมสายอาชีพชั้นสูง ประเภทสถานศึกษานวัตกรรม ปีการศึกษา 2567 ประเภททุน 5 ปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.9 });
                s = { "x": 25, "y": s['y'] + s['h'], "w": 38, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('(ปวช. ต่อเนื่อง ปวส.) ของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 122, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            }

            // s = { "x": s['x'] + s['w'], "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            // doc.font(ThS).fontSize(14).fillColor("black").text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        }


        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ข้อมูลองค์กรผู้เสนอโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ในกรณีที่สถานศึกษาที่มีเขตพื้นที่หรือวิทยาเขตหรือมีลักษณะอื่นที่คล้ายคลึงเขตพื้นที่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.38 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('หรือวิทยาเขต ให้เสนอโครงการในนามสถานศึกษาเท่านั้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่ตั้ง: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_district, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_zipcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรสาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_fax, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เลขประจำตัวผู้เสียภาษี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_idcard, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สังกัด ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("          สำนักงานคณะกรรมการการอาชีวศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();


        s = { "x": 30, "y": s['y'] + s['h'], "w": 130, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('          สถาบันวิทยาลัยชุมชน กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 30, "y": s['y'] + s['h'], "w": 130, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('          กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 30, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('          อื่น ๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        doc.lineWidth(0).stroke();
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_member == "อื่น ๆ" ? MainData.si_member_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        if (MainData.si_member == "สำนักงานคณะกรรมการการอาชีวศึกษา") {
            doc.image('img/check.png', cov(33), cov(92), { width: cov(5), height: cov(5) })
        } else if (MainData.si_member == "สถาบันวิทยาลัยชุมชน กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม") {
            doc.image('img/check.png', cov(33), cov(98.5), { width: cov(5), height: cov(5) })
        } else if (MainData.si_member == "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม") {
            doc.image('img/check.png', cov(33), cov(105), { width: cov(5), height: cov(5) })
        } else if (MainData.si_member == "อื่น ๆ") {
            doc.image('img/check.png', cov(33), cov(111.5), { width: cov(5), height: cov(5) })
        }


        doc.lineWidth(0).stroke();
        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประเภทสถานศึกษา                   รัฐ                   เอกชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 40), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 65), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        if (MainData.si_school_type == "รัฐ") {
            doc.image('img/check.png', cov(58), cov(118), { width: cov(5), height: cov(5) })
        } else if (MainData.si_school_type == "เอกชน") {
            doc.image('img/check.png', cov(83), cov(118), { width: cov(5), height: cov(5) })
        }

        s = { "x": 20, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ระดับการศึกษาที่เปิดสอน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 77.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตร หลักสูตร 1 ปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 77.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตรวิชาชีพ (ปวช.)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 40, "y": s['y'] + s['h'], "w": 77.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อนุปริญญา หลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_level_anu_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 3, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_level_anu_month, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 40, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปริญญาตรี หลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_level_bachelor_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 3, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_level_bachelor_month, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_level_assign != '' ? MainData.si_level_assign : ""
            , cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        const level_couse1 = MainData.si_level_certi1y
        const level_couse2 = MainData.si_level_certi
        const level_couse3 = MainData.si_level_certi_high
        const level_couse4 = MainData.si_level_anu
        const level_couse5 = MainData.si_level_bachelor
        const level_couse6 = MainData.si_level_oth

        if (level_couse1 != '') {
            doc.image('img/check.png', cov(33), cov(130), { width: cov(5), height: cov(5) })
        }
        if (level_couse2 != '') {
            doc.image('img/check.png', cov(110.5), cov(130), { width: cov(5), height: cov(5) })
        }
        if (level_couse3 != '') {
            doc.image('img/check.png', cov(33), cov(136.5), { width: cov(5), height: cov(5) })
        }
        if (level_couse4 != '') {
            doc.image('img/check.png', cov(110.5), cov(136.5), { width: cov(5), height: cov(5) })
        }
        if (level_couse5 != '') {
            doc.image('img/check.png', cov(33), cov(143), { width: cov(5), height: cov(5) })
        }
        if (level_couse6 != '') {
            doc.image('img/check.png', cov(33), cov(149.5), { width: cov(5), height: cov(5) })
        }


        s = { "x": 20, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทั้งสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_student_all, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน จำนวนอาจารย์ทั้งสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_teach_all, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนอาจารย์ที่ทำหน้าที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_teach_count, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 72, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน จำนวนบุคคลากรสายสนับสนุนที่ไม่ได้ทำหน้าที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_support_count, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน แบ่งออกเป็น  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อาจารย์ประจำ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_teach_main, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 29, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน อาจารย์อัตราจ้าง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_teach_hire, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 24, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน  อาจารย์พิเศษ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_teach_special, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ (โปรดระบุ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_teach_assign, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับประกาศนียบัตร 1 ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_count_couse5, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 49, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับ ปวช', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_count_couse1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 49, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับ ปวส', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_count_couse2, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 57, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับอนุปริญญา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_count_couse3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 57, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_count_couse4, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนหลักสูตรที่เปิดสอนระดับ (อื่น ๆ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_count_couse6, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        doc.addPage()



        s = { "x": 20, "y": 20, "w": Types == "นวัตกรรม" ? 170 : 5, "h": 6.5, "bd": border }

        if (Types == "นวัตกรรม") {
            if (TypesPee == 1) {
                doc.font(Bold).fontSize(16).fillColor("black").text('คุณสมบัติสถานศึกษานวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                s = { "x": 40, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('เป็นสถานศึกษาที่จัดการศึกษาหลักสูตรประกาศนียบัตร (1 ปี) หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.32 });
                doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('ที่ได้รับการรับรองจากสภาการพยาบาล ที่ได้รับคัดเลือกเข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง จาก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.42 });
                s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(16).fillColor("black").text('อย่างน้อย 2 ปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).undash().stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text(' (ระหว่างปี 2562 – 2566)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                s = { "x": 40, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('เป็นสถานศึกษาที่จัดการศึกษาหลักสูตรประกาศนียบัตร (1 ปี) หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.21 });
                doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('ที่ได้รับการรับรองจากทันตแพทยสภา ที่ได้รับคัดเลือกเข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง จาก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });
                s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(16).fillColor("black").text('อย่างน้อย 2 ปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).undash().stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text(' (ระหว่างปี 2562 – 2566)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                // console.log("Users", Users)
                if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)") {
                    doc.image('img/check.png', cov(20), cov(26), { width: cov(5), height: cov(5) })
                }
                if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์)") {
                    doc.image('img/check.png', cov(20), cov(45.5), { width: cov(5), height: cov(5) })
                }

                s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
            } else {
                doc.font(Bold).fontSize(16).fillColor("black").text('คุณสมบัติสถานศึกษานวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('เป็นสถานศึกษาที่จัดการศึกษาระดับประกาศนียบัตรวิชาชีพ (ปวช.) ต่อเนื่องระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.1 });
                doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": 20, "y": s['y'] + s['h'], "w": 139, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('ระดับอนุปริญญา ที่ได้รับคัดเลือกเข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.9 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(16).fillColor("black").text('อย่างน้อย 2 ปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).undash().stroke()

                s = { "x": 20, "y": s['y'] + s['h'], "w": 122, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('(ระหว่างปี 2562 – 2566)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                s = { "x": 30, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('เป็นสถานศึกษาที่เคยได้รับคัดเลือกเข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง และเป็นสถานศึกษาในโครงการพัฒนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.2 });
                doc.lineJoin('miter').rect(cov(20), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": 20, "y": s['y'] + s['h'], "w": 177, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('ศูนย์ความเป็นเลิศทางการอาชีวศึกษา (Excellent Center) ปี 2566 และ/หรือศูนย์บริหารเครือข่ายการผลิตและพัฒนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

                s = { "x": 20, "y": s['y'] + s['h'], "w": 177, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('กำลังคนอาชีวศึกษา (Center of Vocational Manpower Networking Management : CVM) ปี 2566 โปรดระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.22 });


                s = { "x": 40, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('เป็นสถานศึกษาในโครงการพัฒนาศูนย์ความเป็นเลิศทางการอาชีวศึกษา (Excellent Center) ปี 2566', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.2 });
                doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": 40, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('เป็นสถานศึกษาในศูนย์บริหารเครือข่ายการผลิตและพัฒนากำลังคนอาชีวศึกษา (Center of Vocational ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.2 });
                doc.lineJoin('miter').rect(cov(30), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": 30, "y": s['y'] + s['h'], "w": 177, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(16).fillColor("black").text('Manpower Networking Management : CVM) ปี 2566', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.22 });


                if (MainData.si_property1) {
                    doc.image('img/check.png', cov(20), cov(26), { width: cov(5), height: cov(5) })
                }
                if (MainData.si_property2) {
                    doc.image('img/check.png', cov(20), cov(45.5), { width: cov(5), height: cov(5) })
                }
                if (MainData.si_property3) {
                    doc.image('img/check.png', cov(30), cov(65), { width: cov(5), height: cov(5) })
                }
                if (MainData.si_property4) {
                    doc.image('img/check.png', cov(30), cov(71.5), { width: cov(5), height: cov(5) })
                }
                s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
            }
        }
        doc.font(Bold).fillColor("black").text('3.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((ceo_prefix == "อื่น ๆ" ? ceo_prefixname_oth : ceo_prefix) + " " + ceo_name + " " + ceo_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_postcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        s = { "x": 20, "y": s['y'] + s['h'], "w": 110, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ระยะเวลาในการดำรงตำแหน่งผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี ณ แห่งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_period, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่ (วัน/เดือน/ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_day + "/" + ceo_month + "/" + ceo_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ถึงปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_exp_time, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        if (TypesPee == 1) {
            if (ceo_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(Types == "นวัตกรรม" ? 124.5 : 79), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(Types == "นวัตกรรม" ? 124.5 : 79), { width: cov(5), height: cov(5) })
            }
        } else if (TypesPee == 2) {
            if (ceo_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(Types == "นวัตกรรม" ? (124.5 + 19.5) : 79), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(Types == "นวัตกรรม" ? (124.5 + 19.5) : 79), { width: cov(5), height: cov(5) })
            }
        } else if (TypesPee == 5) {
            if (ceo_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(Types == "นวัตกรรม" ? (124.5 + 19.5) : 79), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(Types == "นวัตกรรม" ? (124.5 + 19.5) : 79), { width: cov(5), height: cov(5) })
            }
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(48), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_work_at2_oth != '' ? ceo_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        if (Types == "นวัตกรรม") {
            if (TypesPee == 1) {
                if (ceo_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(85 + 45.5), { width: cov(5), height: cov(5) })
                }
                if (ceo_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(91.5 + 45.5), { width: cov(5), height: cov(5) })
                }
            } else if (TypesPee == 2) {
                if (ceo_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(85 + 45.5 + 19.5), { width: cov(5), height: cov(5) })
                }
                if (ceo_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(91.5 + 45.5 + 19.5), { width: cov(5), height: cov(5) })
                }
            } else if (TypesPee == 5) {
                if (ceo_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(85 + 45.5 + 19.5), { width: cov(5), height: cov(5) })
                }
                if (ceo_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(91.5 + 45.5 + 19.5), { width: cov(5), height: cov(5) })
                }
            }

        } else {
            if (ceo_work_at1 != '') {
                doc.image('img/check.png', cov(48), cov(85), { width: cov(5), height: cov(5) })
            }
            if (ceo_work_at2 != '') {
                doc.image('img/check.png', cov(48), cov(91.5), { width: cov(5), height: cov(5) })
            }
        }
        if (TypesPee == 1) {
            s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
            doc.font(Bold).fillColor("black").text('4.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("ผู้บริหารคณะ/สำนักวิชา/คณบดี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text((d_prefix == "อื่น ๆ" ? d_prefixname_oth : d_prefix) + " " + d_name + " " + d_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_postcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



            s = { "x": 20, "y": s['y'] + s['h'], "w": 93, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ระยะเวลาในการดำรงตำแหน่งผู้บริหารคณะ/สำนักวิชา/คณบดี ณ แห่งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_period, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": 20, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ตั้งแต่ (วัน/เดือน/ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_day + "/" + d_month + "/" + d_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ถึงปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
            doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(d_exp_time != '' ? d_exp_time : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
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
            doc.font(ThS).fontSize(14).fillColor('black').text(d_work_at2_oth != '' ? d_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            if (TypesPee == 1) {
                if (d_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(Types != "นวัตกรรม" ? 156.5 : 156.5 + 45.5), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(Types != "นวัตกรรม" ? 156.5 : 156.5 + 45.5), { width: cov(5), height: cov(5) })
                }


                if (d_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(Types != "นวัตกรรม" ? 163 : 163 + 45.5), { width: cov(5), height: cov(5) })
                }
                if (d_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(Types != "นวัตกรรม" ? 169.5 : 169.5 + 45.5), { width: cov(5), height: cov(5) })
                }
            } else if (TypesPee == 2) {
                if (d_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(Types != "นวัตกรรม" ? 156.5 : 156.5 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(Types != "นวัตกรรม" ? 156.5 : 156.5 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                }


                if (d_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(Types != "นวัตกรรม" ? 163 : 163 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                }
                if (d_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(Types != "นวัตกรรม" ? 169.5 : 169.5 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                }
            } else if (TypesPee == 5) {
                if (d_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(Types != "นวัตกรรม" ? 156.5 : 156.5 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(Types != "นวัตกรรม" ? 156.5 : 156.5 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                }


                if (d_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(Types != "นวัตกรรม" ? 163 : 163 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                }
                if (d_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(Types != "นวัตกรรม" ? 169.5 : 169.5 + (45.5 + 19.5)), { width: cov(5), height: cov(5) })
                }
            }



        }



        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text(TypesPee == 1 ? '5.' : '4.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 29, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ผู้รับผิดชอบโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 131, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text(" (ผู้ดำเนินการหลักของโครงการ โดยเป็นผู้ที่มีบทบาทหน้าที่ในการบริหารจัดการโครงการและ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('งบประมาณ อยู่ในระดับผู้บริหารสถานศึกษา หรือไม่ต่ำกว่ากว่าระดับหัวหน้าแผนกที่เกี่ยวข้องกับสาขาที่ยื่นเสนอขอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.32 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('โปรดแนบประวัติผู้รับผิดชอบโครงการโดยย่อ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((res_prefix == "อื่น ๆ" ? res_prefixname_oth : res_prefix) + " " + res_name + " " + res_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำแหน่งในสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สาขาวิชาที่เชี่ยวชาญ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 143, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_branch, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()
        if (TypesPee == 1) {
            doc.addPage()
            s = { "x": 20, "y": 20, "w": 35, "h": 6.5, "bd": border }
        } else {
            s = { "x": 20, "y": s['y'] + s['h'] + 6.5, "w": 35, "h": 6.5, "bd": border }
        }
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

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 115, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_level_couse8_oth != '' ? res_level_couse8_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_postcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_exp_time != '' ? res_exp_time : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
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
        doc.font(ThS).fontSize(14).fillColor('black').text(res_work_at2_oth != '' ? res_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        if (TypesPee == 1) {
            if (res_level_couse1 != '') {
                doc.image('img/check.png', cov(47), cov(20), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse2 != '') {
                doc.image('img/check.png', cov(82), cov(20), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse3 != '') {
                doc.image('img/check.png', cov(117), cov(20), { width: cov(5), height: cov(5) })
            }

            if (res_level_couse4 != '') {
                doc.image('img/check.png', cov(47), cov(26.5), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse5 != '') {
                doc.image('img/check.png', cov(82), cov(26.5), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse6 != '') {
                doc.image('img/check.png', cov(117), cov(26.5), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse7 != '') {
                doc.image('img/check.png', cov(151), cov(26.5), { width: cov(5), height: cov(5) })
            }

            if (res_level_couse12 != '') {
                doc.image('img/check.png', cov(47), cov(33), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse9 != '') {
                doc.image('img/check.png', cov(82), cov(33), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse10 != '') {
                doc.image('img/check.png', cov(117), cov(33), { width: cov(5), height: cov(5) })
            }
            if (res_level_couse11 != '') {
                doc.image('img/check.png', cov(151), cov(33), { width: cov(5), height: cov(5) })
            }

            if (res_level_couse8 != '') {
                doc.image('img/check.png', cov(47), cov(39.5), { width: cov(5), height: cov(5) })
            }


            if (res_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(72.5), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(72.5), { width: cov(5), height: cov(5) })
            }


            if (res_work_at1 != '') {
                doc.image('img/check.png', cov(48), cov(78), { width: cov(5), height: cov(5) })
            }
            if (res_work_at2 != '') {
                doc.image('img/check.png', cov(48), cov(85.5), { width: cov(5), height: cov(5) })
            }
        } else {
            if (Types != "นวัตกรรม") {
                if (res_level_couse1 != '') {
                    doc.image('img/check.png', cov(47), cov(20 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse2 != '') {
                    doc.image('img/check.png', cov(82), cov(20 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse3 != '') {
                    doc.image('img/check.png', cov(117), cov(20 + 130), { width: cov(5), height: cov(5) })
                }

                if (res_level_couse4 != '') {
                    doc.image('img/check.png', cov(47), cov(26.5 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse5 != '') {
                    doc.image('img/check.png', cov(82), cov(26.5 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse6 != '') {
                    doc.image('img/check.png', cov(117), cov(26.5 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse7 != '') {
                    doc.image('img/check.png', cov(151), cov(26.5 + 130), { width: cov(5), height: cov(5) })
                }

                if (res_level_couse12 != '') {
                    doc.image('img/check.png', cov(47), cov(33 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse9 != '') {
                    doc.image('img/check.png', cov(82), cov(33 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse10 != '') {
                    doc.image('img/check.png', cov(117), cov(33 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse11 != '') {
                    doc.image('img/check.png', cov(151), cov(33 + 130), { width: cov(5), height: cov(5) })
                }

                if (res_level_couse8 != '') {
                    doc.image('img/check.png', cov(47), cov(39.5 + 130), { width: cov(5), height: cov(5) })
                }


                if (res_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(72.5 + 130), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(72.5 + 130), { width: cov(5), height: cov(5) })
                }


                if (res_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(78 + 130), { width: cov(5), height: cov(5) })
                }
                if (res_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(85.5 + 130), { width: cov(5), height: cov(5) })
                }
            } else {
                if (res_level_couse1 != '') {
                    doc.image('img/check.png', cov(47), cov(20 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse2 != '') {
                    doc.image('img/check.png', cov(82), cov(20 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse3 != '') {
                    doc.image('img/check.png', cov(117), cov(20 + 130 + 65), { width: cov(5), height: cov(5) })
                }

                if (res_level_couse4 != '') {
                    doc.image('img/check.png', cov(47), cov(26.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse5 != '') {
                    doc.image('img/check.png', cov(82), cov(26.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse6 != '') {
                    doc.image('img/check.png', cov(117), cov(26.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse7 != '') {
                    doc.image('img/check.png', cov(151), cov(26.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }

                if (res_level_couse12 != '') {
                    doc.image('img/check.png', cov(47), cov(33 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse9 != '') {
                    doc.image('img/check.png', cov(82), cov(33 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse10 != '') {
                    doc.image('img/check.png', cov(117), cov(33 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_level_couse11 != '') {
                    doc.image('img/check.png', cov(151), cov(33 + 130 + 65), { width: cov(5), height: cov(5) })
                }

                if (res_level_couse8 != '') {
                    doc.image('img/check.png', cov(47), cov(39.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }


                if (res_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(72.5 + 130 + 65), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(72.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }


                if (res_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(78 + 130 + 65), { width: cov(5), height: cov(5) })
                }
                if (res_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(85.5 + 130 + 65), { width: cov(5), height: cov(5) })
                }
            }
        }

        // ผู้ประสานงานหลักของโครงการ

        const main_prefix = ProjectData['p_prefix'];
        const main_prefixname_oth = ProjectData['p_prefix_oth'];
        const main_name = ProjectData['p_firstname'];
        const main_surname = ProjectData['p_lastname'];
        const main_id = ProjectData['p_idcard'];
        const main_address = ProjectData['p_address'];
        const main_tambon = ProjectData['p_district'];
        const main_amphur = ProjectData['p_amphur'];
        const main_province = ProjectData['p_province'];
        const main_postcode = ProjectData['p_zipcode'];
        const main_tel = ProjectData['p_tel'];
        const main_email = ProjectData['p_email'];
        const main_line = ProjectData['p_lineid'];
        const main_period = ProjectData['p_time'];
        const main_day = ProjectData['p_day'];
        const main_month = ProjectData['p_month'];
        const main_year = ProjectData['p_year'];
        const main_exp = ProjectData['p_experience'];
        const main_exp_time = ProjectData['p_experience_oth'];
        const main_position = ProjectData['p_position'];
        const main_branch = ProjectData['p_branch'];
        const main_level_couse1 = ProjectData['p_level_certi1'];
        const main_level_couse2 = ProjectData['p_level_certi2'];
        const main_level_couse3 = ProjectData['p_level_certi3'];
        const main_level_couse4 = ProjectData['p_level_certi_high1'];
        const main_level_couse5 = ProjectData['p_level_certi_high2'];
        const main_level_couse6 = ProjectData['p_level_anu1'];
        const main_level_couse7 = ProjectData['p_level_anu2'];
        const main_level_couse8 = ProjectData['p_level_oth'];
        const main_level_couse8_oth = ProjectData['p_level_assign'];
        const main_level_couse9 = ProjectData['p_level_bachelor'];
        const main_level_couse10 = ProjectData['p_level_master_degree'];
        const main_level_couse11 = ProjectData['p_level_doctoral_degree'];
        const main_level_couse12 = ProjectData['p_level_certi1y'];
        const main_work_at1 = ProjectData['p_work_at1'];
        const main_work_at2 = ProjectData['p_work_at2'];
        const main_work_at2_oth = ProjectData['p_work_at2_oth'];

        if (TypesPee != 1) {
            doc.addPage()
            s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        } else {
            s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        }
        doc.font(Bold).fillColor("black").text(TypesPee == 1 ? '6.' : '5.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 41, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ประสานงานหลักของโครงการ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 119, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผู้ที่มีบทบาทหน้าที่ในการประสานงานการดำเนินการกับกองทุนเพื่อความเสมอภาค", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.46 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ทางการศึกษา (กสศ.) อาทิเช่น การนำส่งผลงานประกอบการเบิกเงินงวด การนัดหมายการประชุม การจัดกิจกรรม ฯลฯ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((main_prefix == "อื่น ๆ" ? main_prefixname_oth : main_prefix) + " " + main_name + " " + main_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำแหน่งในสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สาขาวิชาที่เชี่ยวชาญ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 143, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_branch, cov(s['x']), cov(s['y']), {
            width: cov(s['w']), align: 'center', characterSpacing: 0
        });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

        doc.undash()

        s = { "x": 20, "y": s['y'] + s['h'] + 6.5, "w": 35, "h": 6.5, "bd": border }

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

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 115, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_level_couse8_oth != '' ? main_level_couse8_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_postcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_exp_time != '' ? main_exp_time : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
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
        doc.font(ThS).fontSize(14).fillColor('black').text(main_work_at2_oth != '' ? main_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        if (TypesPee == 1) {
            if (main_level_couse1 != '') {
                doc.image('img/check.png', cov(47), cov(124 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse2 != '') {
                doc.image('img/check.png', cov(82), cov(124 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse3 != '') {
                doc.image('img/check.png', cov(117), cov(124 + 13), { width: cov(5), height: cov(5) })
            }

            if (main_level_couse4 != '') {
                doc.image('img/check.png', cov(47), cov(130.5 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse5 != '') {
                doc.image('img/check.png', cov(82), cov(130.5 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse6 != '') {
                doc.image('img/check.png', cov(117), cov(130.5 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse7 != '') {
                doc.image('img/check.png', cov(151), cov(130.5 + 13), { width: cov(5), height: cov(5) })
            }

            if (main_level_couse12 != '') {
                doc.image('img/check.png', cov(47), cov(137 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse9 != '') {
                doc.image('img/check.png', cov(82), cov(137 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse10 != '') {
                doc.image('img/check.png', cov(117), cov(137 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_level_couse11 != '') {
                doc.image('img/check.png', cov(151), cov(137 + 13), { width: cov(5), height: cov(5) })
            }

            if (main_level_couse8 != '') {
                doc.image('img/check.png', cov(47), cov(143.5 + 13), { width: cov(5), height: cov(5) })
            }


            if (main_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(176.5 + 13), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(176.5 + 13), { width: cov(5), height: cov(5) })
            }


            if (main_work_at1 != '') {
                doc.image('img/check.png', cov(48), cov(182 + 13), { width: cov(5), height: cov(5) })
            }
            if (main_work_at2 != '') {
                doc.image('img/check.png', cov(48), cov(189.5 + 13), { width: cov(5), height: cov(5) })
            }
        } else {
            if (Types != "นวัตกรรม") {
                if (main_level_couse1 != '') {
                    doc.image('img/check.png', cov(47), cov(124 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse2 != '') {
                    doc.image('img/check.png', cov(82), cov(124 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse3 != '') {
                    doc.image('img/check.png', cov(117), cov(124 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }

                if (main_level_couse4 != '') {
                    doc.image('img/check.png', cov(47), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse5 != '') {
                    doc.image('img/check.png', cov(82), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse6 != '') {
                    doc.image('img/check.png', cov(117), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse7 != '') {
                    doc.image('img/check.png', cov(151), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }

                if (main_level_couse12 != '') {
                    doc.image('img/check.png', cov(47), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse9 != '') {
                    doc.image('img/check.png', cov(82), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse10 != '') {
                    doc.image('img/check.png', cov(117), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse11 != '') {
                    doc.image('img/check.png', cov(151), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }

                if (main_level_couse8 != '') {
                    doc.image('img/check.png', cov(47), cov(143.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }


                if (main_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(176.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(176.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }


                if (main_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(182 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(189.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
            } else {
                if (main_level_couse1 != '') {
                    doc.image('img/check.png', cov(47), cov(124 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse2 != '') {
                    doc.image('img/check.png', cov(82), cov(124 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse3 != '') {
                    doc.image('img/check.png', cov(117), cov(124 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }

                if (main_level_couse4 != '') {
                    doc.image('img/check.png', cov(47), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse5 != '') {
                    doc.image('img/check.png', cov(82), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse6 != '') {
                    doc.image('img/check.png', cov(117), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse7 != '') {
                    doc.image('img/check.png', cov(151), cov(130.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }

                if (main_level_couse12 != '') {
                    doc.image('img/check.png', cov(47), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse9 != '') {
                    doc.image('img/check.png', cov(82), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse10 != '') {
                    doc.image('img/check.png', cov(117), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_level_couse11 != '') {
                    doc.image('img/check.png', cov(151), cov(137 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }

                if (main_level_couse8 != '') {
                    doc.image('img/check.png', cov(47), cov(143.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }


                if (main_exp == "มี") {
                    doc.image('img/check.png', cov(138.5), cov(176.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                } else {
                    doc.image('img/check.png', cov(122.5), cov(176.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }


                if (main_work_at1 != '') {
                    doc.image('img/check.png', cov(48), cov(182 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
                if (main_work_at2 != '') {
                    doc.image('img/check.png', cov(48), cov(189.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
                }
            }
        }


        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text(TypesPee == 1 ? '7.' : '6.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 41, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("เจ้าหน้าที่การเงินโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 119, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผู้ที่มีบทบาทหน้าที่ในการประสานงานการดำเนินการกับกองทุนเพื่อความเสมอภาค", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.46 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ทางการศึกษา (กสศ.) อาทิเช่น การนำส่งผลงานประกอบการเบิกเงินงวด การนัดหมายการประชุม การจัดกิจกรรม ฯลฯ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });


        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 148, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((fn_prefix == "อื่น ๆ" ? fn_prefixname_oth : fn_prefix) + " " + fn_name + " " + fn_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำแหน่งในสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 135, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('สาขาวิชาที่เชี่ยวชาญ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text(fn_branch, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        doc.undash()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_postcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_exp_time != '' ? fn_exp_time : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
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
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_work_at2_oth != '' ? fn_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        if (TypesPee == 1) {
            if (fn_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(254.5 + 13), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(254.5 + 13), { width: cov(5), height: cov(5) })
            }


            if (fn_work_at1 != '') {
                doc.image('img/check.png', cov(48), cov(260 + 13), { width: cov(5), height: cov(5) })
            }
            if (fn_work_at2 != '') {
                doc.image('img/check.png', cov(48), cov(267.5 + 13), { width: cov(5), height: cov(5) })
            }
        } else {
            if (fn_exp == "มี") {
                doc.image('img/check.png', cov(138.5), cov(254.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(122.5), cov(254.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
            }


            if (fn_work_at1 != '') {
                doc.image('img/check.png', cov(48), cov(260 - 71.5 + 13), { width: cov(5), height: cov(5) })
            }
            if (fn_work_at2 != '') {
                doc.image('img/check.png', cov(48), cov(267.5 - 71.5 + 13), { width: cov(5), height: cov(5) })
            }
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
    }
};

export const PDF2 = async (req) => {

    const MainMajor = req['Major']
    const TypesPee = req['TypesPee']
    const Types = req['Types']
    const TotalFund = req['TotalFund']
    const Users = req['Users']
    const AreaHeight = req['AreaHeight']
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


        doc.font(Bold).fontSize(16).fillColor('black');


        // doc.addPage()
        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('ส่วนที่ 2 รายละเอียดโครงการ', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



        doc.addPage()
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        if (TypesPee == '1') {
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("กลุ่มเป้าหมาย : ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 137, "h": 6.5, "bd": border }
            doc.font(Italic).fontSize(14).fillColor('black').text("นักศึกษาทุน 1 ปี (ผู้รับทุนไม่น้อยกว่า 30 คน และไม่เกินกว่า 150 คน โดยต้องมีจำนวนผู้ขอรับทุนราย ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('สาขา จำนวนอย่างน้อย 15 คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        } else if (TypesPee == '2') {
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("กลุ่มเป้าหมาย : ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
            doc.font(Italic).fontSize(14).fillColor('black').text("นักศึกษาทุน 2 ปี ปวส./อนุปริญญา จำนวนรวม", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            // console.log("TotalFund", TotalFund)
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(TotalFund[0].TotalFund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('คน (ระบุชื่อหลักสูตรสาขาที่ได้รับ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 1.47 });

            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('การอนุมัติ โดยทั้งสองประเภททุนจะต้องมีจำนวนหลักสูตรสาขาวิชา/สาขางาน ไม่เกิน 5 สาขางาน และจะต้องมีผู้รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });

            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('ไม่น้อยกว่า 30 คน และไม่เกินกว่า 150 คน โดยต้องมีจำนวนผู้ขอรับทุนรายสาขางาน จำนวนอย่างน้อย 15 คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });
        } else if (TypesPee == '5') {
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("กลุ่มเป้าหมาย : ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
            doc.font(Italic).fontSize(14).fillColor('black').text("นักศึกษาทุน 5 ปี ปวช ต่อเนื่อง ปวส จำนวนรวม", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            // console.log("TotalFund", TotalFund)
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(TotalFund[0].TotalFund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('คน (ระบุชื่อหลักสูตรสาขาที่ได้รับ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 1.47 });

            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('การอนุมัติ โดยทั้งสองประเภททุนจะต้องมีจำนวนหลักสูตรสาขาวิชา/สาขางาน ไม่เกิน 5 สาขางาน และจะต้องมีผู้รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });

            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('ไม่น้อยกว่า 30 คน และไม่เกินกว่า 150 คน โดยต้องมีจำนวนผู้ขอรับทุนรายสาขางาน จำนวนอย่างน้อย 15 คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });
        }

        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 41, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สาขาวิชาที่สถานศึกษาเสนอ : ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 119, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("สาขาที่ท่านเห็นว่ามีศักยภาพในการจัดการเรียนการสอน ทั้งนี้สามารถเสนอจำนวน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });

        if (Types == "ทั่วไป") {
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('หลักสูตรสาขาที่เคยได้รับการคัดเลือกจาก กสศ. ไม่เกิน ' + (TypesPee == '1' ? '2' : '5') + ' สาขา โปรดระบุหลักสูตรสาขา ดังนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.moveTo(cov(s['x'] + 18), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 112), cov(s['y'] + s['h'] - 1)).undash().stroke()
        } else {
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('หลักสูตรสาขาที่เคยได้รับการคัดเลือกจาก กสศ. ไม่เกิน 3 สาขา โปรดระบุหลักสูตรสาขา ดังนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.moveTo(cov(s['x'] + 18), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 112), cov(s['y'] + s['h'] - 1)).undash().stroke()
        }



        let loop = [1, 2];
        let chkRow = 0
        for await (let i of MainMajor) {
            // console.log("-----", i)
            // 
            if (chkRow >= 1) {
                doc.addPage()
                s = { "x": 20, "y": 20, "w": 47, "h": 5, "bd": border }
            } else {
                if (TypesPee == 1) {
                    if (Users[0]['u_type4'] == " ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)") {
                        s = { "x": 33, "y": s['y'] + s['h'], "w": 47, "h": 6.5, "bd": border }
                    } else {
                        s = { "x": 33, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
                    }
                } else if (TypesPee == 2) {

                    s = { "x": 33, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
                } else if (TypesPee == 5) {

                    s = { "x": 33, "y": s['y'] + s['h'], "w": 38, "h": 6.5, "bd": border }
                }
            }

            if (TypesPee == 1) {
                doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y']), { width: cov(5), height: cov(5) })
                // console.log("[u_type4]", Users)
                if (Users[0]['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)") {
                    doc.font(ThS).fontSize(14).fillColor("black").text('หลักสูตรผู้ช่วยพยาบาล 1 ปี จำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                } else {
                    doc.font(ThS).fontSize(14).fillColor("black").text('หลักสูตรผู้ช่วยทันตแพทย์ 1 ปี จำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                }
                //                 
                // ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์)
                // doc.font(ThS).fontSize(14).fillColor("black").text('หลักสูตรผู้ช่วยพยาบาล 1 ปี จำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_fund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 88, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('คน (ต้องได้รับการรับรองหลักสูตรจากสภาการพยาบาลเป็นเวลาไม่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });

                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('ต่ำกว่า 3 ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            } else if (TypesPee == 2) {
                doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y']), { width: cov(5), height: cov(5) })

                doc.font(ThS).fontSize(14).fillColor("black").text('2.' + (chkRow + 1) + ' ปวส./อนุปริญญา หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 95, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 25, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("จำนวนทุนที่เสนอขอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_fund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            } else if (TypesPee == 5) {
                doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y']), { width: cov(5), height: cov(5) })

                doc.font(ThS).fontSize(14).fillColor("black").text('2.' + (chkRow + 1) + ' ปวช. หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 112, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 25, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("จำนวนทุนที่เสนอขอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.m_fund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            }


            s = { "x": 43, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
            doc.font(Bold).fillColor("black").text('สาขาที่เป็นเป้าหมายหลักในการพัฒนาประเทศ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();


            s = { "x": 53, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('อุตสาหกรรมที่มีศักยภาพ (First S-curve)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] - 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

            s = { "x": 63, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ยานยนต์สมัยใหม่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('อิเล็กทรอนิกส์อัจฉริยะ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();


            s = { "x": 63, "y": s['y'] + s['h'], "w": 122, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('อุตสาหกรรมกลุ่มรายได้ดีและอุตสาหกรรมการท่องเที่ยวเชิงสุขภาพ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

            s = { "x": 63, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('เกษตรและเทคโนโลยีชีวภาพ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('การแปรรูปอาหาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();


            s = { "x": 53, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('อุตสาหกรรมอนาคต (New S-curve)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] - 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

            s = { "x": 63, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หุ่นยนต์เพื่ออุตสาหกรรม และเพื่อคุณภาพชีวิต ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('การบินและโลจิสติกส์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();


            s = { "x": 63, "y": s['y'] + s['h'], "w": 35, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('เคมีชีวภาพ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ดิจิทัล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('เครื่องมือและอุปกรณ์การแพทย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();


            s = { "x": 43, "y": s['y'] + s['h'], "w": 44, "h": 6.5, "bd": border }
            if (TypesPee == 1) {
                doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y']), { width: cov(5), height: cov(5) })
            } else {
                if (i.md_group == "สาขาที่เป็นเป้าหมายหลักในการพัฒนาประเทศ") {
                    doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y'] - 52), { width: cov(5), height: cov(5) })
                    if (i.md_focus == "อุตสาหกรรมที่มีศักยภาพ (First S-curve)") {
                        if (i.md_vehicle == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 12), cov(s['y'] - 39), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_electronic == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 82), cov(s['y'] - 39), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_travel == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 12), cov(s['y'] - 32), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_farm == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 12), cov(s['y'] - 26), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_transform == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 82), cov(s['y'] - 26), { width: cov(5), height: cov(5) })
                        }
                        doc.image('img/check.png', cov(s['x'] + 2.5), cov(s['y'] - 45.5), { width: cov(5), height: cov(5) })
                    } else if (i.md_focus == "อุตสาหกรรมอนาคต (New S-curve)") {
                        doc.image('img/check.png', cov(s['x'] + 2.5), cov(s['y'] - 19.5), { width: cov(5), height: cov(5) })
                        if (i.md_robot == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 12), cov(s['y'] - 13), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_logistic == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 82), cov(s['y'] - 13), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_chemical == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 12), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_digital == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 47), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
                        }
                        if (i.md_tool == "yes") {
                            doc.image('img/check.png', cov(s['x'] + 82), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
                        }

                    }

                } else if (i.md_group == "สาขาที่ขาดแคลนด้านสายอาชีพ") {
                    doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y']), { width: cov(5), height: cov(5) })

                    if (i.md_focus == "หลักสูตร หรือสาขาวิชา/สาขางานที่ขาดแคลนในท้องถิ่นหรือจังหวัดที่สถานศึกษาตั้งอยู่ อาจรวมถึงพื้นที่จังหวัดใกล้เคียง โดยการแสดงข้อมูลเหตุผลประกอบที่ชัดเจน") {
                        doc.image('img/check.png', cov(s['x'] + 2.5), cov(s['y'] + 6.5), { width: cov(5), height: cov(5) })
                    } else if (i.md_focus == "หลักสูตรที่ตอบโจทย์นโยบายสนับสนุนการสร้างพลังสร้างสรรค์") {
                        doc.image('img/check.png', cov(s['x'] + 2.5), cov(s['y'] + 19.5), { width: cov(5), height: cov(5) })
                    } else if (i.md_focus == "หลักสูตรสาขาวิชาการศึกษาปฐมวัย") {
                        doc.image('img/check.png', cov(s['x'] + 2.5), cov(s['y'] + 39), { width: cov(5), height: cov(5) })
                    } else if (i.md_focus == "หลักสูตรสาขากลุ่มการบริการบุคคล (Human Service) เช่น การดูแลผู้สูงอายุ การดูแลเด็กเล็ก") {
                        doc.image('img/check.png', cov(s['x'] + 2.5), cov(s['y'] + 45.5), { width: cov(5), height: cov(5) })
                    }


                } else if (i.md_group == "สาขาด้านวิทยาศาสตร์เทคโนโลยี (STEM) และเทคโนโลยีดิจิทัล") {
                    doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y'] + 58.5), { width: cov(5), height: cov(5) })
                }
            }
            doc.font(Bold).fillColor("black").text('สาขาที่ขาดแคลนด้านสายอาชีพ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 88, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('(โปรดให้ข้อมูลรายละเอียดความขาดแคลนในสาขาในระดับพื้นที่)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });


            s = { "x": 53, "y": s['y'] + s['h'], "w": 132, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หลักสูตร หรือสาขาวิชา/สาขางานที่ขาดแคลนในท้องถิ่นหรือจังหวัดที่สถานศึกษาตั้งอยู่ อาจรวมถึงพื้นที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] - 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('จังหวัดใกล้เคียง โดยการแสดงข้อมูลเหตุผลประกอบที่ชัดเจน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



            s = { "x": 53, "y": s['y'] + s['h'], "w": 132, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หลักสูตรที่ตอบโจทย์นโยบายสนับสนุนการสร้างพลังสร้างสรรค์ (ระดับ ปวส./อนุปริญญา) โดยมุ่งหวังให้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] - 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('สถานศึกษาขยายผลการดำเนินโครงการให้เกิดผลลัพธ์ของการพัฒนาในระดับชุมชน ตำบล อำเภอ และจังหวัด ผ่านการบูรณา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('การ การทำงานร่วมกับหน่วยงานในชุมชน ตำบล อำเภอ และจังหวัด และสามารถวิเคราะห์มูลค่าที่จะเกิดขึ้นได', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": 53, "y": s['y'] + s['h'], "w": 132, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หลักสูตรสาขาวิชาการศึกษาปฐมวัย (ระดับ ปวส./อนุปริญญา)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] - 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

            s = { "x": 53, "y": s['y'] + s['h'], "w": 132, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หลักสูตรสาขากลุ่มการบริการบุคคล (Human Service) (ระดับ ปวส./อนุปริญญา) เช่น การดูแลผู้สูงอายุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.1 });
            doc.lineCap('square').circle(cov(s['x'] - 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('การดูแลเด็กเล็ก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



            s = { "x": 43, "y": s['y'] + s['h'], "w": 100, "h": 6.5, "bd": border }
            doc.font(Bold).fillColor("black").text('สาขาด้านวิทยาศาสตร์เทคโนโลยี (STEM) และเทคโนโลยีดิจิทัล ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).undash().stroke();


            if (TypesPee == 1) {

                s = { "x": 25, "y": s['y'] + s['h'], "w": 104, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปีที่ศึกษาหลักสูตรผู้ช่วยพยาบาล 1 ปี ณ ปี 2566 ในสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.md_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 88, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
            } else if (TypesPee == 2) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 107, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปีที่ศึกษาในระดับ ปวส./อนุปริญญา ณ ปี 2566 ในสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.md_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 88, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
            } else if (TypesPee == 5) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 107, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปีที่ศึกษาในระดับ ปวส./อนุปริญญา ณ ปี 2566 ในสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(i.md_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 88, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
            }


            s = { "x": 25, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('จำนวนปีที่เปิดสอนมาแล้ว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.md_open, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ปี จำนวนครูอาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.md_teacher, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 88, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });



            s = { "x": 25, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ระบุเฉพาะรายชื่อคณะอาจารย์ที่มีคุณวุฒิตรงกับสาขา ไม่เกิน 5 ท่าน) รายละเอียดดังนี้ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


            let chkTbrow = 0

            for await (let dataI of i.teacher) {
                // console.log("dataI", dataI)
                doc.addPage()
                let pD2 = [];

                pD2.push(
                    [
                        (dataI.mt_prefix == "อื่น ๆ" ? dataI.mt_prefix_oth : dataI.mt_prefix) + dataI.mt_firstname + " " + dataI.mt_lastname,
                        dataI.mt_position,
                        'วุฒิการศึกษา ' + (dataI.mt_education == "อื่น ๆ" ? dataI.mt_education_oth : dataI.mt_education) + '\nสถาบันที่สำเร็จ ' + dataI.mt_school + '\nปีที่สำเร็จ ' + dataI.mt_end,
                        // dataI.mt_exp,
                        dataI.mt_time,
                    ]
                )
                const table = {
                    title: "",
                    headers: [
                        { label: "รายชื่อครู\n/อาจารย์", headerAlign: "center", align: "left" },
                        { label: "ตำแหน่ง", headerAlign: "center", align: "left" },
                        { label: 'วุฒิการศึกษา/สถาบันที่สำเร็จ\nการศึกษา/ปีที่สำเร็จการศึกษา', headerAlign: "center", align: "left" },
                        // { label: 'ประสบการณ์ทำงาน/\nผลงานวิชาการ/\nการฝึกอบรมที่ตรง\nตามสาขา*', headerAlign: "center", align: "left" },
                        { label: 'ระยะเวลาในการ\nเป็นครู/อาจารย์\nประจำสาขา', headerAlign: "center", align: "left" },
                    ],
                    rows: pD2,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table, {
                    prepareHeader: () => doc.font(Bold).fontSize(12).fillColor('black'),
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font(ThS).fontSize(12).fillColor('black')
                        xr++
                    },
                    columnsSize: [cov(30), cov(30), cov(70), cov(30)],
                    x: cov(25), y: cov(20)
                });

                chkTbrow++

                s = { "x": 25, "y": voc(doc.y), "w": 160, "h": 6.5, "bd": border }

                doc.font(Bold).fontSize(14).fillColor("black").text('ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา*', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.mt_exp.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });


            }


            s = { "x": 25, "y": voc(doc.y), "w": 160, "h": 6.5, "bd": border }

            doc.font(ThS).fontSize(14).fillColor("black").text('* สำหรับอาจารย์พิเศษ หรืออาจารย์ที่มีคุณวุฒิไม่สอดคล้องกับสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            chkRow++

            if (TypesPee == 5) {
                doc.addPage()
                s = { "x": 20, "y": 20, "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('โดยจะสามารถศึกษาต่อในระดับ ปวส. ในหลักสูตรสาขาวิชา/สาขางาน (โปรดระบุชื่อหลักสูตรสาขาที่จะสามารถทำการศึกษา ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });

                s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('ต่อในระดับ ปวส. ที่ได้รับอนุมัติโดยหน่วยงานที่เกี่ยวข้อง จำนวนไม่เกิน 3 สาขาวิชา/สาขางานที่สอดคล้องกับสาขาวิชา/สาขางานในระดับ ปวช. ให้ครบถ้วน) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.35 });

                s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
                doc.font(ThS).fillColor("black").text('สาขางานที่สอดคล้องกับสาขาวิชา/สาขางานในระดับ ปวช. ให้ครบถ้วน) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
                let pD22 = [];

                for await (let dataI2 of i.Follow) {
                    pD22.push(
                        [
                            "สาขาวิชา " + dataI2.mh_major + "\nสาชางาน " + dataI2.mh_work,
                            dataI2.mh_confirm + " (" + dataI2.mh_confirm_year + ")",
                            dataI2.mh_student,
                            dataI2.mh_open,
                            dataI2.mh_teacher,
                        ]
                    )
                }
                const table2 = {
                    title: "",
                    headers: [
                        { label: "สาขาวิชา/สาขางาน", headerAlign: "center", align: "left" },
                        { label: "หน่วยงานที่\nอนุมัติหลักสูตร", headerAlign: "center", align: "left" },
                        { label: 'นักศึกษาทุกชั้นปี (คน)', headerAlign: "center", align: "center" },
                        { label: 'เปิดสอนมาแล้ว (ปี)', headerAlign: "center", align: "center" },
                        { label: 'ครูอาจารย์ประจำสาขา (คน)', headerAlign: "center", align: "center" },
                    ],
                    rows: pD22,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table2, {
                    prepareHeader: () => doc.font(Bold).fontSize(12).fillColor('black'),
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font(ThS).fontSize(12).fillColor('black')
                        xr++
                    },
                    columnsSize: [cov(50), cov(30), cov(30), cov(30), cov(30)],
                    x: cov(20), y: doc.y + 20
                });

            }
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
    }
};

export const PDF3 = async (req) => {

    const TypesPee = req['TypesPee']
    const MajorData = req['Person']['Major']
    const ManageData = req['Person']['Manage']
    const EmpData = req['Person']['Emp']
    const Problem = req['Problem']
    const MainMajor = req['Major']
    const Users = req['Users']['0']

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


        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('4.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("วัตถุประสงค์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 137, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผลลัพธ์ ผลกระทบที่ต้องการให้เกิดขึ้นกับนักเรียน/นักศึกษาและสถานศึกษา) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

        // console.log("Before", doc)

        // console.log("After", doc.x)
        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('วัตถุประสงค์ของโครงการนี้ คือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        // console.log("After", doc.x)





        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('-', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 157, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('สร้างโอกาสที่เสมอภาคของเยาวชนผู้ขาดแคลนทุนทรัพย์และด้อยโอกาสให้ได้รับการศึกษาที่มีคุณภาพระดับสูงกว่ามัธยมศึกษาตอนปลาย ตลอดจนส่งเสริมให้ผู้สำเร็จการศึกษาดังกล่าวสามารถมีงานทำ', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.18 });

        s = { "x": 25, "y": voc(doc.y), "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('-', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 157, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ยกระดับคุณภาพสถานศึกษาในการผลิตกำลังคนสายอาชีพชั้นสูงให้ตอบสนองต่อความต้องการและเพิ่มขีดความสามารถทางการแข่งขันของประเทศตามแผนยุทธศาสตร์ประเทศไทย 4.0', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.18 });

        for await (const p of Problem) {
            s = { "x": 25, "y": voc(doc.y), "w": 3, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('-', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 157, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text(p.o_objective, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.18 });
        }

        doc.addPage({ layout: 'landscape' })
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('5.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("รายละเอียดสาขาที่สถานศึกษาเสนอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        if (TypesPee == 1) {
            let chkRows = 0
            for await (let i of MainMajor) {
                if (chkRows != 0) {
                    doc.addPage({ layout: 'landscape' })
                }
                // console.log(i)
                let pD2 = [];
                for await (let dataI of i.Approve) {
                    // console.log('------i------', dataI)
                    let txtChk1 = "[ ]"
                    let txtChk2 = "[ ]"
                    let txtChk3 = "[ ]"
                    let txtRadio1 = ["( )", "( )", "( )"]
                    let txtRadio2 = ["( )", "( )"]
                    if (dataI.ma_course == "หลักสูตรปกติที่เปิดสอนโดยทั่วไป") {
                        txtChk1 = "[/]"
                    } else if (dataI.ma_course == "หลักสูตรที่มีการพัฒนากับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่ร่วม") {
                        txtChk2 = "[/]"
                    } else if (dataI.ma_course == "หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา") {
                        txtChk3 = "[/]"
                    }

                    if (dataI.ma_course_type == "รัฐ") {
                        txtRadio1 = ["(/)", "( )", "( )"]
                    } else if (dataI.ma_course_type == "เอกชน") {
                        txtRadio1 = ["( )", "(/)", "( )"]
                    } else if (dataI.ma_course_type == "ท้องถิ่น") {
                        txtRadio1 = ["( )", "( )", "(/)"]
                    }

                    if (dataI.ma_budget == "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน") {
                        txtRadio2 = ["(/)", "( )"]
                    } else if (dataI.ma_budget == "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น") {
                        txtRadio2 = ["( )", "(/)"]
                    }
                    let Payaban = "";
                    if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)") {
                        // doc.image('img/check.png', cov(20), cov(26), { width: cov(5), height: cov(5) })
                        Payaban = ". หลักสูตรผู้ช่วยพยาบาล"
                    }
                    if (Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยทันตแพทย์)") {
                        // doc.image('img/check.png', cov(20), cov(45.5), { width: cov(5), height: cov(5) })
                        Payaban = ". หลักสูตรผู้ช่วยทันตแพทย์"
                    }




                    pD2.push(
                        [
                            TypesPee == 1 ? ((chkRows + 1) + Payaban) : (chkRows + 1) + ". " + i.m_major + (TypesPee == 1 ? "" : i.m_major != '' ? "\n   สาขางาน " + i.m_major : ""),
                            "ได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร " + dataI.ma_confirm.replaceAll("\r\n", "\n").replaceAll("	", "  ") + "",
                            "" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป\n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับสถานบริการสุขภาพที่ร่วม" + "\n     " + txtRadio1[0] + " รัฐ\n     " + txtRadio1[1] + " เอกชน\n     " + txtRadio1[2] + " ท้องถิ่น\n" + txtRadio2[0] + " ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน โปรดระบุรายการที่ได้รับการสนับสนุน\n" + txtRadio2[1] + " ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ\n" + txtChk3 + " หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา ",
                        ]
                    )
                    const table2 = {
                        title: "",
                        headers: [
                            { label: "ชื่อหลักสูตรสาขาที่รับการอนุมัติจาก\nหน่วยงานต้นสังกัดที่ต้องการยื่นเสนอขอ", headerAlign: "center", align: "left" },
                            { label: "การอนุมัติหลักสูตร", headerAlign: "center", align: "left" },
                            { label: 'หลักสูตร', headerAlign: "center", align: "left" },
                        ],
                        rows: pD2,

                    };

                    doc.font(Bold).fontSize(12).fillColor('black');
                    let xr = 0
                    await doc.table(table2, {
                        prepareHeader: (x) => {
                            doc.font(Bold).fontSize(12).fillColor('black')
                        },
                        prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                            doc.font(ThS).fontSize(12).fillColor('black')
                        },
                        columnsSize: [cov(50), cov(90), cov(100)],
                        x: cov(20), y: cov(30)
                    });

                    chkRows++
                    if (dataI.ma_course_comp != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ระบุชื่อสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_course_comp.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                    }
                    if (dataI.ma_budget_comp != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ได้รับงบประมาณ หรือทรัพยากร สนับสนุนจากสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ดังนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_budget_comp.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                    }
                    if (dataI.ma_result != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ผลลัพธ์ที่สถานประกอบการคาดหวังจากการทำความร่วมมือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_result.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                    }
                    // ผลที่ลัพธ์ที่คาดหวังจากการทำความร่วมมือ " + dataI.ma_result.replaceAll("\r\n", "\n").replaceAll("	", "  ")

                }


            }
        } else {
            let chkRows = 0
            for await (let i of MainMajor) {
                if (chkRows != 0) {
                    doc.addPage({ layout: 'landscape' })
                }
                let pD2 = [];
                for await (let dataI of i.Approve) {
                    // console.log('------i------', dataI)
                    // let chk1 = ["[ ]","[ ]","[ ]"]
                    // if(i.ma_course)
                    let txtChk1 = "[ ]"
                    let txtChk2 = "[ ]"
                    let txtChk3 = "[ ]"
                    if (dataI.ma_course == "หลักสูตรปกติที่เปิดสอนโดยทั่วไป") {
                        txtChk1 = "[/]"
                    } else if (dataI.ma_course == "หลักสูตรที่มีการพัฒนากับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่ร่วม") {
                        txtChk2 = "[/]"
                    } else if (dataI.ma_course == "หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา") {
                        txtChk3 = "[/]"
                    }


                    let chkbox1 = "[ ]"
                    let chkbox2 = "[ ]"
                    let chkbox3 = "[ ]"
                    let chkbox4 = "[ ]"
                    let chkbox5 = "[ ]"
                    let chkbox6 = "[ ]"
                    let chkbox7 = "[ ]"
                    let chkbox8 = "[ ]"

                    if (dataI.ma_process1 != '') {
                        chkbox1 = "[/]"
                    }
                    if (dataI.ma_process2 != '') {
                        chkbox2 = "[/]"
                    }
                    if (dataI.ma_process3 != '') {
                        chkbox3 = "[/]"
                    }
                    if (dataI.ma_process4 != '') {
                        chkbox4 = "[/]"
                    }
                    if (dataI.ma_process5 != '') {
                        chkbox5 = "[/]"
                    }
                    if (dataI.ma_process6 != '') {
                        chkbox6 = "[/]"
                    }
                    if (dataI.ma_process7 != '') {
                        chkbox7 = "[/]"
                    }


                    // let txtRadio1 = ["( )", "( )", "( )"]
                    // let txtRadio2 = ["( )", "( )"]

                    // if (dataI.ma_course_type == "รัฐ") {
                    //     txtRadio1 = ["(/)", "( )", "( )"]
                    // } else if (dataI.ma_course_type == "เอกชน") {
                    //     txtRadio1 = ["( )", "(/)", "( )"]
                    // } else if (dataI.ma_course_type == "ท้องถิ่น") {
                    //     txtRadio1 = ["( )", "( )", "(/)"]
                    // }

                    // if (dataI.ma_budget == "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน") {
                    //     txtRadio2 = ["(/)", "( )"]
                    // } else if (dataI.ma_budget == "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น") {
                    //     txtRadio2 = ["( )", "(/)"]
                    // }


                    pD2.push(
                        [
                            (chkRows + 1) + ". สาขาวิชา\n" + i.m_major + "\nสาขางาน " + i.m_work + "\nได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร\n" + dataI.ma_confirm + "\n" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป \n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับ\nสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่ร่วม\n" + txtChk3 + " หลักสูตรที่มีโครงการความร่วมมือ\nผลิตบุคลากรให้กับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่มีความชัดเจน\nและรับประกันการมีงานทำของผู้รับทุน\nหลังจบการศึกษา",
                            (dataI.ma_budget_comp != "" ? "ได้รับงบประมาณ หรือ\nทรัพยากร สนับสนุนจาก\nสถานประกอบการ ดังนี\n" + dataI.ma_budget_comp : ""),
                            "กระบวนการพัฒนาหลักสูตรร่วม\n" + chkbox1 + " การทำโครงงาน/งานวิจัยร่วมกัน\n" + chkbox2 + " แลกเปลี่ยน ครู อาจารย์ภาคประกอบการ\n" + chkbox3 + " การฝึกประสบการณ์วิชาชีพในสถานประกอบการ\n" + chkbox4 + " การออกแบบรายวิชา กระบวนการเรียนรู้ร่วมกัน\n" + chkbox5 + " การสนับสนุนอุปกรณ์การเรียน ห้องปฏิบัติการ\n" + chkbox6 + " การว่าจ้างนักศึกษาที่จบในหลักสูตรในสาขาที่พัฒนาหลักสูตรร่วมเข้าทำงาน\nหลังสำเร็จการศึกษา\n" + chkbox7 + " อื่นๆ " + (dataI.ma_process7_oth != '' ? dataI.ma_process7_oth : ""),
                            // dataI.ma_plan.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            // dataI.ma_next_plan.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        ]
                        // [
                        //     TypesPee == 1 ? (หลักสูตรผู้ช่วยพยาบาล") : (chkRows + 1) + ". " + i.m_major + (TypesPee == 1 ? "" : i.m_major != '' ? "\n   สาขางาน " + i.m_major : ""),
                        //     "ได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร " + dataI.ma_confirm.replaceAll("\r\n", "\n").replaceAll("	", "  ") + "",
                        //     "" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป\n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับสถานบริการสุขภาพที่ร่วม\n" + "หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่ร่วม " + dataI.ma_course_comp.replaceAll("\r\n", "\n").replaceAll("	", "  ") + "\n     " + txtRadio1[0] + " รัฐ\n     " + txtRadio1[1] + " เอกชน\n     " + txtRadio1[2] + " ท้องถิ่น\n" + txtRadio2[0] + " ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน โปรดระบุรายการที่ได้รับการสนับสนุน\n" + txtRadio2[1] + " ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ\n" + txtChk3.replaceAll("\r\n", "\n").replaceAll("	", "  ") + " หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น ที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา ระบุชื่อสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น " + dataI.ma_budget_comp.replaceAll("\r\n", "\n").replaceAll("	", "  ") + "\nผลที่ลัพธ์ที่คาดหวังจากการทำความร่วมมือ " + dataI.ma_result.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        // ]
                    )
                    const table2 = {
                        title: "",
                        headers: [
                            { label: "สาขาวิชา/สาขางาน", headerAlign: "center", align: "left" },
                            { label: "งบประมาณ\nและทรัพยากรอื่น ๆ", headerAlign: "center", align: "left" },
                            { label: 'รายวิชาที่จัดการเรียนการสอน\nในสถานประกอบการ', headerAlign: "center", align: "left" },
                            // { label: 'ผลการดำเนินงาน\nที่ผ่านมา', headerAlign: "center", align: "left" },
                            // { label: 'การพัฒนาระยะต่อไป\n(Next Step)', headerAlign: "center", align: "left" },
                        ],
                        rows: pD2,

                    };

                    doc.font(Bold).fontSize(12).fillColor('black');
                    let xr = 0
                    await doc.table(table2, {
                        prepareHeader: (x) => {
                            doc.font(Bold).fontSize(12).fillColor('black')
                        },
                        prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                            doc.font(ThS).fontSize(12).fillColor('black')
                        },
                        columnsSize: [cov(50), cov(90), cov(100)],
                        x: cov(20), y: cov(30)
                    });

                    chkRows++
                    doc.addPage({ layout: 'landscape' })
                    if (dataI.ma_course_comp != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ระบุชื่อสถานประกอบการ/สถานบริการสุขภาพ/หน่วยงานรัฐ/หน่วยงานท้องถิ่น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_course_comp.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                    }
                    if (dataI.ma_result != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ผลลัพธ์ที่สถานประกอบการคาดหวังจากการทำความร่วมมือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_result.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });

                    }
                    if (dataI.ma_parttime != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('สถานประกอบการที่ส่งนักศึกษาทุนนวัตกรรมฯไปทวิภาคี/ฝึกงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_parttime.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });


                    }
                    if (dataI.ma_subject != '') {
                        s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ชื่อรายวิชา อัตราส่วนครูฝึกต่อจำนวนนักศึกษา วิธีการสอน ผู้สอน วิธีการประเมินผล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_subject.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                    }

                    s = { "x": 25, "y": voc(doc.y), "w": 160, "h": 6.5, "bd": border }
                    doc.font(Bold).fontSize(14).fillColor("black").text('ผลการดำเนินงานที่ผ่านมา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                    s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                    doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_plan.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });


                    s = { "x": 25, "y": voc(doc.y), "w": 240, "h": 6.5, "bd": border }
                    doc.font(Bold).fontSize(14).fillColor("black").text('การพัฒนาระยะต่อไป (Next Step)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                    s = { "x": 25, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
                    doc.font(ThS).fontSize(14).fillColor("black").text("          " + dataI.ma_next_plan.replaceAll("\r\n", "\n").replaceAll("	", "  "), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });


                }


            }
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
    }
};

export const PDF4 = async (req) => {
    // console.log(req['Dorm'])
    const Dorm = req['Dorm'] == null ? "" : req['Dorm'][0]
    const DormSub = req['DormSub']
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
            // layout: `portrait`,
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        let arrDorm = ["( )", "( )", "( )"]

        if (Dorm.dc_data == "มี เพียงพอกับจำนวนนักศึกษาทุน") {
            arrDorm = ["(/)", "( )", "( )"]
        } else if (Dorm.dc_data == "มี แต่ไม่เพียงพอกับจำนวนนักศึกษาทุน") {
            arrDorm = ["( )", "(/)", "( )"]
        } else if (Dorm.dc_data == "ไม่มี") {
            arrDorm = ["( )", "( )", "(/)"]
        }

        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('8.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 170, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานศึกษามีแนวทางในการพัฒนาระบบดูแลความเป็นอยู่และสวัสดิภาพของผู้เรียนให้สามารถเรียนจบตามกำหนดเวลาอย่างไร ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ทั้งแนวทางและกลไกในการติดตามดูแล ป้องกัน เฝ้า ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 250, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ระวัง และให้คำปรึกษาแก่ผู้รับทุน รวมถึงการประสานงานอย่างใกล้ชิดกับพ่อแม่ ผู้ปกครองตลอดระยะเวลาของการศึกษา รวมถึงแสดงวิธีการที่จะส่งเสริมคุณภาพชีวิตและการเรียนรู้ของผู้รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 250, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('อย่างมีประสิทธิภาพ ทั้งด้านร่างกาย จิตใจ อารมณ์ และสังคม) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('8.3.1 การจัดหอพักและระบบดูแลที่ดีและเอื้อต่อการเรียนรู้ โดยคำนึงถึงราคาที่เหมาะสมและความปลอดภัย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('สถานศึกษาของท่านสามารถจัดหอพักที่มีของสถานศึกษาสำหรับนักศึกษาผู้รับทุนของโครงการฯ เป็นการเฉพาะได้หรือไม่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('' + arrDorm[0] + ' มี เพียงพอกับจำนวนนักศึกษาทุน          ' + arrDorm[1] + ' มี แต่ไม่เพียงพอกับจำนวนนักศึกษาทุน          ' + arrDorm[2] + ' ไม่มี (โปรดระบุวิธีการบริหารจัดการด้านล่าง) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.08 });
        if (Dorm.dc_data == "มี เพียงพอกับจำนวนนักศึกษาทุน" || Dorm.dc_data == "มี แต่ไม่เพียงพอกับจำนวนนักศึกษาทุน") {

            s = { "x": 20, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
            doc.font(Bold).fillColor("black").text('รายละเอียดหอพัก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

            let pD3 = [];
            for await (let X of DormSub) {
                let TxtDoms = ""
                TxtDoms += X['d_detail_home'] != '' ? '- ' + X['d_detail_home'] + '\n' : ''
                TxtDoms += X['d_detail_dorm_oth'] != '' ? '- ' + X['d_detail_dorm'] + ' จำนวน ' + X['d_detail_dorm_oth'] + ' ชั้น\n' : ''
                TxtDoms += X['d_detail_toilet_per'] != '' ? '- ' + X['d_detail_toilet_per'] + '\n' : ''
                TxtDoms += X['d_detail_toilet_sum'] != '' ? '- ' + X['d_detail_toilet_sum'] + '\n' : ''
                TxtDoms += X['d_detail_assign'] != '' ? '- ' + X['d_detail_oth'] + ' : ' + X['d_detail_assign'] + '\n' : ''

                pD3.push(
                    [
                        X.d_type == "อื่น ๆ" ? X.d_type_oth : X.d_type,
                        X.d_format == "อื่น ๆ" ? X.d_format_oth : X.d_format,
                        TxtDoms.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.d_room_fund.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.d_person_fund.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    ],
                )
            }
            const table3 = {
                title: "",
                headers: [
                    { label: "ประเภทหอพัก", headerAlign: "center", align: "left" },
                    { label: "รูปแบบหอพัก", headerAlign: "center", align: "left" },
                    { label: "รายละเอียดหอพัก", headerAlign: "center", align: "left" },
                    { label: 'จำนวนห้องที่รองรับผู้รับทุน\n(ปี 2567) (ห้อง)', headerAlign: "center", align: "left" },
                    { label: 'จำนวนผู้รับทุนฃืฃื\n(ปี 2567) ที่รองรับได้ (คน)', headerAlign: "center", align: "left" },
                ],
                rows: pD3,

            };

            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            await doc.table(table3, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(50), cov(50), cov(50), cov(50), cov(50)],
                x: cov(25), y: cov(70)
            });

            s = { "x": 20, "y": voc(doc.y + 20), "w": 15, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('โปรดระบุ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 245, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(": หอพัก 1 ห้อง จะสามารถจัดให้ผู้รับทุนอาศัยอยู่ได้ จำนวน " + Dorm.dc_count_live + " คน อาจารย์ผู้ดูแลหอพัก สัดส่วน ครู : ผู้รับทุนในหอพัก " + Dorm.dc_count_teacher + " : " + Dorm.dc_count_fund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": 20, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('โปรดแนบแผนผังและภาพถ่ายหอพักนักศึกษา และประกาศอัตราการเรียกเก็บค่าเช่าหอพักและค่าสาธารณูปโภค', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

            s = { "x": 40, "y": s['y'] + s['h'], "w": 240, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('ระยะทางจากหอพักถึงสถานศึกษา ' + Dorm.dc_count_distance + ' กิโลเมตร ' + Dorm.dc_count_met + " เมตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
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
    }

};

export const PDF5 = async (req) => {

    const Area = req['Area']
    const AreaHeight = req['AreaHeight']

    const TypesPee = req['TypesPee']
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
            // layout: `portrait`,
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('7.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานที่ที่จะดำเนินการสอน  ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(แยกรายหลักสูตรสาขาที่ต้องการยื่นเสนอขอ) (ระบุสถานที่จัดการเรียนการสอน สถานศึกษา… ตำบล…อำเภอ…จังหวัด….) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });

        if (TypesPee == 1) {
            let rox = 1
            let pD3 = [];

            for await (let X of Area) {
                pD3.push(
                    [
                        rox + ". " + X.m_major.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_place.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_district.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_amphur.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_province.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    ],
                )
                rox++
            }
            const table3 = {
                title: "",
                headers: [
                    { label: TypesPee == "1" ? "ชื่อหลักสูตรสาขาที่เสนอ " : "ชื่อหลักสูตรสาขาวิชา/สาขางานที่เสนอ ในระดับ ปวช.", headerAlign: "center", align: "left" },
                    { label: "ชื่อสถานที่จัดการเรียนการสอน", headerAlign: "center", align: "left" },
                    { label: "ตำบล", headerAlign: "center", align: "left" },
                    { label: 'อำเภอ', headerAlign: "center", align: "left" },
                    { label: 'จังหวัด', headerAlign: "center", align: "left" },
                ],
                rows: pD3,

            };

            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            await doc.table(table3, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(80), cov(80), cov(30), cov(30), cov(30)],
                x: cov(25), y: cov(35)
            });
        } else {
            let rox = 1
            let pD3 = [];

            for await (let X of Area) {
                pD3.push(
                    [
                        rox + ". " + X.m_major.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.m_work.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_place.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_district.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_amphur.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tp_province.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    ],
                )
                rox++
            }
            const table3 = {
                title: "",
                headers: [
                    { label: TypesPee == "1" ? "ชื่อหลักสูตรสาขาที่เสนอ " : "ชื่อหลักสูตรสาขาวิชา/สาขางานที่เสนอ", headerAlign: "center", align: "left" },
                    { label: "สาขางาน", headerAlign: "center", align: "left" },
                    { label: "ชื่อสถานที่จัดการเรียนการสอน", headerAlign: "center", align: "left" },
                    { label: "ตำบล", headerAlign: "center", align: "left" },
                    { label: 'อำเภอ', headerAlign: "center", align: "left" },
                    { label: 'จังหวัด', headerAlign: "center", align: "left" },
                ],
                rows: pD3,

            };

            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            await doc.table(table3, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(55), cov(50), cov(55), cov(30), cov(30), cov(30)],
                x: cov(25), y: cov(35)
            });
        }

        if (TypesPee == 5) {
            let rox2 = 1
            let pD32 = [];
            for await (let X of AreaHeight) {
                pD32.push(
                    [
                        rox2 + ". " + X.mh_major.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.mh_work.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tph_place.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tph_district.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tph_amphur.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        X.tph_province.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    ],
                )
                rox2++
            }
            const table32 = {
                title: "",
                headers: [
                    { label: "ชื่อหลักสูตรสาขาวิชา/สาขางานที่เสนอ ในระดับ ปวส.", headerAlign: "center", align: "left" },
                    { label: "สาขางาน", headerAlign: "center", align: "left" },
                    { label: "ชื่อสถานที่จัดการเรียนการสอน", headerAlign: "center", align: "left" },
                    { label: "ตำบล", headerAlign: "center", align: "left" },
                    { label: 'อำเภอ', headerAlign: "center", align: "left" },
                    { label: 'จังหวัด', headerAlign: "center", align: "left" },
                ],
                rows: pD32,

            };

            doc.font(Bold).fontSize(12).fillColor('black');
            let xr2 = 0
            await doc.table(table32, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(55), cov(50), cov(55), cov(30), cov(30), cov(30)],
                x: cov(25), y: doc.y + 20
            });

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
    }
};

export const PDF6 = async (req) => {
    const Types = req['Types']
    try {
        if (Types == "ทั่วไป") {
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

            // console.log("SuportChk", req['SuportChk'])
            const AnyToon = req['AnyToon']
            const Toon = req['Toon']
            const SuportChk = req['SuportChk']['0'] == null ? "" : req['SuportChk']['0']
            const TypesPee = req['TypesPee']

            s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(TypesPee == 1 ? '9.' : '8.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 180, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("สถานศึกษาเคยรับทุนสนับสนุนของ กสศ. หรือไม่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุน กสศ. ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

            s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("           ไม่เคยรับทุน กสศ. ระบุเหตุผล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

            s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุน กสศ. (ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] + 2.5), cov(s['y']), cov(5), cov(5)).undash().stroke();

            s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุนนวัตกรรมสายอาชีพชั้นสูง ของ กสศ.", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] + 2.5), cov(s['y']), cov(5), cov(5)).undash().stroke();
            if (SuportChk.school_received != "ไม่เคยรับทุน") {
                doc.image('img/check.png', cov(s['x'] + 3), cov(s['y'] - 19.5), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(s['x'] + 3), cov(s['y'] - 13), { width: cov(5), height: cov(5) })
            }
            if (SuportChk.spc_ever_fund == "เคยรับทุน กสศ. (ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง)") {
                doc.image('img/check.png', cov(s['x'] + 3), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
            }
            if (SuportChk.spc_ever_innovation == "เคยรับทุนนวัตกรรมสายอาชีพชั้นสูง ของ กสศ.") {
                doc.image('img/check.png', cov(s['x'] + 3), cov(s['y']), { width: cov(5), height: cov(5) })
            }
            s = { "x": 20, "y": s['y'], "w": 170, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("                                                   " + (SuportChk.school_received_oth != null ? SuportChk.school_received_oth : ""), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
            if (SuportChk.school_received == "ไม่เคยรับทุน") {
                doc.image('img/check.png', cov(33), cov(92), { width: cov(5), height: cov(5) })
            }
            if (AnyToon != null) {
                let pD3 = [];
                for await (let X of AnyToon) {
                    pD3.push(
                        [
                            X.sp_name.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_year.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_success.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        ],
                    )
                }
                const table3 = {
                    title: "ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง",
                    headers: [
                        { label: "ชื่อทุน", headerAlign: "center", align: "left" },
                        { label: "ปีที่รับทุน", headerAlign: "center", align: "left" },
                        { label: "ความสำเร็จของการบริหารโครงการ", headerAlign: "center", align: "left" },
                    ],
                    rows: pD3,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table3, {
                    prepareHeader: (x) => {
                        doc.font(Bold).fontSize(12).fillColor('black')
                    },
                    prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font(ThS).fontSize(12).fillColor('black')
                    },
                    columnsSize: [cov(75), cov(20), cov(75)],
                    x: cov(20), y: doc.y
                });
            }


            if (Toon != null) {
                let pD4 = [];
                for await (let X of Toon) {
                    pD4.push(
                        [
                            X.sp_name.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_type.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_year.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_budget.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_target.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_success.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        ],
                    )
                }
                const table4 = {
                    title: "ทุนนวัตกรรมสายอาชีพชั้นสูง",
                    headers: [
                        { label: "ชื่อโครงการ", headerAlign: "center", align: "left" },
                        { label: "ประเภททุน", headerAlign: "center", align: "left" },
                        { label: "ปีที่ได้รับทุน", headerAlign: "center", align: "left" },
                        { label: "งบประมาณรวม", headerAlign: "center", align: "left" },
                        { label: "กลุ่มเป้าหมาย", headerAlign: "center", align: "left" },
                        { label: "ความสำเร็จของโครงการ", headerAlign: "center", align: "left" },
                    ],
                    rows: pD4,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                await doc.table(table4, {
                    prepareHeader: (x) => {
                        doc.font(Bold).fontSize(12).fillColor('black')
                    },
                    prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font(ThS).fontSize(12).fillColor('black')
                    },
                    columnsSize: [cov(40), cov(30), cov(20), cov(20), cov(20), cov(40)],
                    x: cov(20), y: doc.y
                });

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
        } else {
            return undefined
        }
    } catch (error) {
        console.log(error)
    }
};

export const PDF7 = async (req) => {

    try {
        const Bold = 'font/THSarabunNew Bold.ttf';

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


        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('ส่วนที่ 3 คำรับรอง', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });




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

export const PDF8 = async (req) => {

    const Users = req['Users']['0']
    const CeoData = req['Person']['Ceo']
    const ManageData = req['Person']['Manage']
    const EmpData = req['Person']['Emp']
    const TypesPee = req['TypesPee']


    let ceo_prefix = CeoData.p_prefix
    let ceo_prefixname_oth = CeoData.p_prefix_oth
    let ceo_name = CeoData.p_firstname
    let ceo_surname = CeoData.p_lastname
    // ผู้รับผิดชอบโครงการ
    const res_prefix = ManageData['p_prefix']
    const res_prefixname_oth = ManageData['p_prefix_oth']
    const res_name = ManageData['p_firstname']
    const res_surname = ManageData['p_lastname']


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


        s = { "x": 20, "y": 20, "w": 170, "h": 5, "bd": border }
        doc.font(Bold).fontSize(16).fillColor("black").text('ส่วนที่ 3 คำรับรอง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });


        s = { "x": 40, "y": s['y'] + s['h'] + 7, "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 119, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 149, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ได้ศึกษาประกาศ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สำนักงาน กสศ. เรื่อง เปิดรับโครงการทุนนวัตกรรมสายอาชีพชั้นสูง ปีการศึกษา 2567 รวมถึงแนวทางและเงื่อนไขการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.6 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สนับสนุนการดำเนินงานโครงการของ กสศ. โดยละเอียดแล้ว และขอรับรองว่า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(1) ข้อความ ข้อมูล และรายละเอียดต่าง ๆ ที่ข้าพเจ้าได้ให้ไว้ในแบบเสนอโครงการเป็นความจริงทุกประการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.47 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ซึ่งหากระหว่างการพิจารณาคัดเลือกข้อเสนอโครงการนี้ กสศ. ตรวจพบว่ามีข้อความ ข้อมูล หรือรายละเอียดต่าง ๆ อื่นใดเป็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('เท็จ หรือปกปิดข้อความจริงอันควรแจ้งให้ทราบ โครงการจะไม่ได้รับการพิจารณา และในกรณีมีการอนุมัติและเบิกจ่ายเงิน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.46 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ให้แก่โครงการแล้ว ข้าพเจ้าจะชำระเงินดังกล่าวคืนให้แก่ กสศ. เต็มจำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.46 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(2) แบบข้อเสนอโครงการนี้ จัดทำขึ้นเพื่อขอรับทุนการสนับสนุนจาก กสศ. เป็นการเฉพาะ ไม่ได้ทำขึ้นเพื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.52 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ขอรับการสนับสนุนงบประมาณจากรัฐ เอกชน หรือหน่วยงานอื่นใดในลักษณะรายการของบประมาณซ้ำซ้อน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(3) ขอรับรองว่าแบบเสนอโครงการไม่ได้เกิดจากการคัดลอก ดัดแปลง เอกสารที่เป็นลิขสิทธิ์ใด ๆ อย่างไม่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.58 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ถูกต้องตามกฎหมาย ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(4) ผลงาน เอกสาร และข้อมูลอื่นใด ที่ข้าพเจ้าส่งมอบให้แก่ กสศ. ทั้งหมดเป็นกรรมสิทธิ์ตามกฎหมายโดยชอบของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('กสศ.        ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(5) ข้าพเจ้าได้ตรวจสอบความถูกต้อง ครบถ้วน ของเอกสารเพื่อนำส่งแบบเสนอโครงการตามรายการเอกสาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.48 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ด้านล่างอย่างครบถ้วนแล้ว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(6) ข้าพเจ้ายอมรับผลการพิจารณาแบบเสนอโครงการของ กสศ. และยอมรับว่าการพิจารณาตัดสินของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.49 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ถือเป็นที่สุด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(7) ข้าพเจ้ารับทราบและยินยอมให้ กสศ. และ/หรือ นิติบุคคลที่ได้รับมอบหมาย บันทึกข้อมูล และใช้ข้อมูล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.52 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ของข้าพเจ้าในการทำธุรกรรม และ/หรือ การใช้บริการของข้าพเจ้า เพื่อประโยชน์ในการให้บริการแก่ข้าพเจ้า และ/หรือ เพื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ประโยชน์อื่นใดที่ข้าพเจ้าได้ให้ความยินยอมไว้แก่ กสศ. รวมถึงเพื่อการวิเคราะห์ข้อมูล เสนอให้ใช้ และ/หรือ ปรับปรุง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.63 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('กระบวนการหรือบริการอื่น นอกจากนี้ กสศ. อาจใช้ข้อมูลของข้าพเจ้าเพื่อการปฏิบัติตามกฎระเบียบต่าง ๆ ของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.64 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าพเจ้ามีสิทธิ์ในความเป็นส่วนตัวในข้อมูลของข้าพเจ้า กสศ. ได้รับความยินยอมจากข้าพเจ้าตามวัตถุประสงค์ดังกล่าวข้างต้น ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('จะเป็นไปเพื่อประโยชน์แก่ข้าพเจ้าและไม่เป็นการแสวงหาผลกำไรจากการใช้ข้อมูลดังกล่าวและ กสศ. จะไม่เปิดเผยข้อมูลของ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.37 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าพเจ้าให้แก่บุคคล และ/หรือ นิติบุคคลอื่น เว้นแต่ในกรณีดังต่อไปนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.38 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('- การเปิดเผยข้อมูลให้แก่บุคลากรผู้ที่ได้รับอนุญาตจาก กสศ. ซึ่ง ได้แก่ บุคลากรในส่วนงานของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0. });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('- การเปิดเผยข้อมูลดังกล่าวเป็นไปเพื่อปฏิบัติตามกฎหมาย เพื่อการสอบสวนหรือการดำเนินการทางกฎหมาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0. });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('- การเปิดเผยข้อมูลดังกล่าวเป็นไปตามกฎหมายหรือตามคำสั่งของ หน่วยงานรัฐ หรือหน่วยงานกำกับดูแล กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0. });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('- การเปิดเผยข้อมูลให้แก่บุคคล และ/หรือ นิติบุคคล ที่ กสศ. ได้รับความยินยอมจากข้าพเจ้าตามวัตถุประสงค์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('  ดังกล่าวข้างต้นจะเป็นไปเพื่อประโยชน์แก่ข้าพเจ้าและไม่เป็นการแสวงหาผลกำไร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.38 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(8) การยื่นข้อเสนอตามโครงการนี้ ไม่ก่อให้ข้าพเจ้ามีสิทธิเรียกร้องค่าธรรมเนียม ค่าเสียหาย หรือค่าใช้จ่ายอื่นใด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(9) ข้าพเจ้าจะเรียกเก็บค่าธรรมเนียมการศึกษาตามหลักสูตรจาก กสศ. เท่านั้น และห้ามสถานศึกษาเรียกเก็บ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.45 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ค่าธรรมเนียมการศึกษาจากนักศึกษาผู้รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(10) ผู้รับผิดชอบโครงการในแต่ละสาขางานได้รับทราบและพร้อมที่จะปฏิบัติตามข้อเสนอแนะของคณะหนุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.49 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('เสริมและ กสศ.        ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        doc.addPage()


        s = { "x": 40, "y": 20, "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(11) ผู้บริหารและคณะทำงานได้ทำความเข้าใจข้อเสนอโครงการฯ ต่อ กสศ. อย่างชัดเจน และพร้อมจะ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.72 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ดำเนินการตามข้อเสนอแนะ และข้อปรับปรุงเพื่อยกระดับคุณภาพของโครงการฯ จากคณะหนุนเสริม และ กสศ. และจะ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.59 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ดำเนินการส่งเอกสารต่าง ๆ ที่เกี่ยวข้องให้เป็นไปตามกำหนดเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 90, "y": 50, "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 90, "y": s['y'] + s['h'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(")", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 90, "y": s['y'] + s['h'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("หัวหน้าโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        s = { "x": 90, "y": s['y'] + s['h'] + 20, "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 90, "y": s['y'] + s['h'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((res_prefix == "อื่น ๆ" ? res_prefixname_oth : res_prefix) + " " + res_name + " " + res_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(")", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 90, "y": s['y'] + s['h'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ผู้รับผิดชอบโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        s = { "x": 90, "y": s['y'] + s['h'] + 20, "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 90, "y": s['y'] + s['h'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((ceo_prefix == "อื่น ๆ" ? ceo_prefixname_oth : ceo_prefix) + " " + ceo_name + " " + ceo_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(")", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 90, "y": s['y'] + s['h'], "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ผู้บริหารสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });





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

export const PDF9 = async (req) => {

    const Product = req['Product']
    const Product2 = req['Product2']
    const Toon = req['Toon']
    const SuportChk = req['SuportChk']
    const TypesPee = req['TypesPee']

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
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text(TypesPee == 1 ? '10.' : '10.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 56, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text(" ผลผลิตและผลลัพธ์ที่สำคัญของโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 131, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(สำหรับสถานศึกษาที่ผ่านการพิจารณาคัดเลือกจะต้องดำเนินการตลอด", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.9 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("ระยะเวลาโครงการ)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        let chkRows = 3

        let pD3 = [
            ['1', 'รายงานความก้าวหน้าของสถานศึกษารายภาคเรียนในการพัฒนาคุณภาพนักศึกษาและสถานศึกษาตามกรอบที่ กสศ. กำหนด'],
            ['2', 'รายงานความก้าวหน้าของนักศึกษาผู้รับทุนตามระยะเวลาที่กำหนด ได้แก่ ผลการเรียน แฟ้มสะสมผลงาน (Portfolio) ที่แสดงผลการพัฒนาของเด็กทั้งด้านผลการเรียน ทักษะการเรียนรู้และพฤติกรรม รวมถึงความเสี่ยงต่าง ๆ'],
            ['3', 'รายงานการเงินตามแบบฟอร์มของ กสศ. และในกรณีที่ได้รับเงินงวดตั้งแต่ 500,000 บาทขึ้นไป จะต้องจัดให้มีผู้สอบบัญชีตรวจสอบและรายงานผลการตรวจสอบรายงานการเงินด้วย']
        ];
        for await (let X of Product) {
            chkRows++
            pD3.push(
                [
                    chkRows,
                    X.pd_product.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                ],
            )

        }
        const table3 = {
            title: "ผลผลิต",
            headers: [
                { label: "#", headerAlign: "center", align: "center" },
                { label: "ผลผลิตที่เกิดขึ้น/ผลผลิตที่ส่งมอบ กสศ.", headerAlign: "center", align: "left" },
            ],
            rows: pD3,

        };

        doc.font(Bold).fontSize(12).fillColor('black');
        let xr = 0
        await doc.table(table3, {
            prepareHeader: () => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(10), cov(160)],
            x: cov(20), y: doc.y
        });


        let chkRow2 = 6
        let pD4 = [
            ['1', 'นักศึกษาผู้รับทุนได้รับการศึกษาจนสำเร็จการศึกษาตามหลักสูตร และได้รับการพัฒนาศักยภาพ มีโอกาสทางอาชีพสามารถพึ่งพาตนเองได้ ตลอดจนได้รับการดูแลสวัสดิภาพ สุขภาพ และพัฒนาทักษะชีวิตที่เหมาะสมสำหรับโลกยุคปัจจุบัน'],
            ['2', 'สถานศึกษามีระบบที่ดีในการดูแลนักศึกษาที่มีพื้นฐานเสียเปรียบ เนื่องจากความขาดแคลนทุนทรัพย์และด้อยโอกาสในลักษณะองค์รวม และมีการป้องกันการหลุดออกจากระบบการศึกษา '],
            ['3', 'สถานศึกษาสามารถพัฒนาหลักสูตรหรือกระบวนการเรียนการสอนที่ทำให้เกิดสมรรนะ (Competencies) สอดคล้องกับความต้องการของตลาดแรงงาน รวมถึงการเป็นผู้ประกอบการเอง มีต้นแบบแนวทางในการจัดการศึกษาสายอาชีพที่นำไปต่อยอดได้'],
            ['4', 'สถานศึกษาสามารถจัดระบบการทำงานร่วมกับภาคเอกชนหรือแหล่งงานภายนอก เพื่อเพิ่มโอกาสการมีงานทำหรือศึกษาต่อของนักศึกษาหลังสำเร็จการศึกษา'],
            ['5', 'สถานศึกษาเป็นต้นแบบแนวทางการจัดการศึกษาสายอาชีพในการสร้างโอกาสทางการศึกษาที่เสมอภาคสำหรับการจัดทำข้อเสนอเชิงนโยบาย และการพัฒนาประสิทธิภาพ'],
            ['6', 'การลดความเหลื่อมล้ำทางการศึกษาระหว่างผู้ขาดแคลนทุนทรัพย์ และด้อยโอกาส และประชากรของประเทศที่เหลือ โดยกลุ่มเป้าหมายมีโอกาสทางเศรษฐกิจและสังคมที่สูงขึ้น']
        ];

        // console.log("Product2", Product2)
        if (Product2.length > 0) {
            for await (let X of Product2) {
                chkRow2++
                pD4.push(
                    [
                        chkRow2,
                        X.pd_result.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    ],
                )
            }
        }
        const table4 = {
            title: "ผลลัพธ์",
            headers: [
                { label: "#", headerAlign: "center", align: "center" },
                { label: "การเปลี่ยนแปลงที่เกิดขึ้นกับนักเรียน/นักศึกษา และสถานศึกษา", headerAlign: "center", align: "left" },
            ],
            rows: pD4,

        };

        doc.font(Bold).fontSize(12).fillColor('black');
        await doc.table(table4, {
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(10), cov(160)],
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
    }
};

export const PDF10 = async (req) => {

    const Manage = req['Manage']
    const TypesPee = req['TypesPee']

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
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text(TypesPee == 1 ? '12.' : '12.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 123, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text(" การบริหารจัดการประเด็นที่จะทำให้สถานศึกษาไม่ประสบความสำเร็จในการดำเนินโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 131, "h": 6.5, "bd": border }
        // doc.font(Italic).fontSize(14).fillColor('black').text("ระบุประเด็นที่จะ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.9 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("ระบุประเด็นที่จะเกิดขึ้น ผลกระทบที่คาดว่าจะเกิดขึ้น และวิธีการการบริหารจัดการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        let pD3 = [];
        for await (let X of Manage) {
            pD3.push(
                [
                    X.mn_issue.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.mn_effect.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.mn_protect.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                ],
            )
        }
        // console.log(pD3)

        const table3 = {
            title: "ผลผลิต",
            headers: [
                { label: "ประเด็นที่ทำให้สถานศึกษาไม่ประสบความสำเร็จใน\nการดำเนินโครงการ\n(โปรดระบุ สิ่งที่เกิดขึ้นจริง ในสถานศึกษาของท่าน)", headerAlign: "center", align: "left" },
                { label: "ผลกระทบที่เกิดขึ้น", headerAlign: "center", align: "left" },
                { label: "วิธีการการบริหารจัดการและ\nการป้องกันไม่ให้เกิดความเสี่ยง", headerAlign: "center", align: "left" },
            ],
            rows: pD3,

        };

        doc.font(Bold).fontSize(12).fillColor('black');
        let xr = 0
        await doc.table(table3, {
            prepareHeader: () => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(65), cov(52.5), cov(52.5)],
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
    }
};

export const PDF11 = async (req) => {

    try {
        const Bold = 'font/THSarabunNew Bold.ttf';

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


        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('เอกสารแนบท้าย', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

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

export const PDF12 = async (req) => {
    const SupReflect = req['SupReflect'] == null ? "" : req['SupReflect']
    const SupReflectOth = req['SupReflectOth'] == null ? "" : req['SupReflectOth'][0].sro_data

    const TypesPee = req['TypesPee']
    // console.log("SupReflect : ", SupReflect)
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
            // layout: `portrait`,
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });


        s = { "x": 20, "y": 20, "w": 170, "h": 5, "bd": border }

        doc.font(Bold).fillColor("black").text('6. ข้อมูลสนับสนุนที่สะท้อนถึงผลการดำเนินงานของสถานศึกษา (การคงอยู่ การออกกลางคัน และการมีงานทำ หรือการศึกษาต่อในระดับที่สูงขึ้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        let pD3 = [];
        let majroHead = {};
        for await (let X of SupReflect) {
            majroHead[TypesPee != '1' ? ("สาขาวิชา " + X.m_major + " สาขางาน " + X.m_work) : ("สาขาวิชา " + X.m_major)] = []
        }
        for await (let X of SupReflect) {
            majroHead[TypesPee != '1' ? ("สาขาวิชา " + X.m_major + " สาขางาน " + X.m_work) : ("สาขาวิชา " + X.m_major)].push([
                X.sr_year,
                X.sr_freshy,
                X.sr_std_continue,
                X.sr_std_drop,
                X.sr_std_congrat,
                X.sr_std_work,
                X.sr_std_high,
                X.sr_std_together,
                X.sr_std_sum_work,
            ]
            )
        }


        const table0 = {
            headers: [
                { label: "ปีการศึกษา\nที่รับนักศึกษาเข้า", headerAlign: "center", align: "center" },
                { label: "นักศึกษาแรกเข้า*\n(คน)", headerAlign: "center", align: "center" },
                { label: "นักศึกษาคงอยู่\nสะสม (คน)", headerAlign: "center", align: "center" },
                { label: "นักศึกษาที่ออก\nกลางคันสะสม\n(คน)", headerAlign: "center", align: "center" },
                { label: "นักศึกษาทุนที่\nสำเร็จการศึกษา\n(คน)", headerAlign: "center", align: "center" },
                { label: "ผู้มีงานทำหรือ\nประกอบอาชีพอิสระ\n(คน)", headerAlign: "center", align: "center" },
                { label: "ผู้ศึกษาต่อในระดับ\nที่สูงขึ้น (คน)", headerAlign: "center", align: "center" },
                { label: "ผู้ที่ทำงานและ\nศึกษาต่อไปพร้อมกัน\n(คน)", headerAlign: "center", align: "center" },
                { label: "รายได้เฉลี่ยต่อเดือน\nของผู้มีงานทำหรือ\nประกอบอาชีพอิสระ\n(บาท)", headerAlign: "center", align: "center" },
            ],

        };

        doc.font(Bold).fontSize(12).fillColor('black');
        await doc.table(table0, {
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
            },
            columnsSize: [cov(25), cov(25), cov(25), cov(30), cov(30), cov(30), cov(30), cov(30), cov(30)],
            x: cov(25), y: cov(30)
        });
        for await (let [mKey, mVal] of Object.entries(majroHead)) {
            let table1 = {}
            let table3 = {}
            // console.log("mKey : ", mKey, "mVal : ", mVal[0][1])

            table1 = {
                title: "",
                headers: [
                    { label: mKey, headerAlign: "left", align: "center", headerColor: "#FFFFFF", headerOpacity: 0 },

                ],

            };

            doc.font(Bold).fontSize(12).fillColor('black');
            await doc.table(table1, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(255)],
                x: cov(25), y: doc.y
            });

            table3 = {
                title: "",
                headers: [
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                    { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
                ],

                rows: mVal,

            };

            doc.font(Bold).fontSize(12).fillColor('black');
            let xr = 0
            await doc.table(table3, {
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(25), cov(25), cov(25), cov(30), cov(30), cov(30), cov(30), cov(30), cov(30)],
                x: cov(25), y: doc.y - 19
            });

        }



        s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาที่มีงานทำ ประกอบอาชีพอิสระ หรือการศึกษาต่อในระดับที่สูงขึ้น (เช่น การสำรวจโดยใช้แบบสำรวจ ปี 2565) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


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


export const PDF13 = async (req) => {

    const Course = req['Course']
    const TypesPee = req['TypesPee']
    let CourseHeigh = []
    if (TypesPee == '5') {
        CourseHeigh = req['CourseHeigh']
    }
    const typePeeTxt = {
        "2": ". ปวส./อนุปริญญา หลักสูตรสาขาวิชา ",
        "5": ". ปวช. หลักสูตรสาขาวิชา",
    }


    const Users = req['Users']['0']
    // Users['u_type4'] == "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)"
    const typePeeSize = {
        "2": [52, 113],
        "5": [37, 128],
    }

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

        let coI = 1
        s = { "x": 20, "y": 20, "w": 160, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('การพัฒนาหลักสูตรและกระบวนการเรียนการสอนให้มีคุณภาพสูง ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 100, "h": 5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('(โปรดระบุให้ครบทุกหลักสูตรสาขาที่ต้องการยื่นเสนอขอ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        for await (const d of Course) {
            console.log(d)
            if (coI != 1) {
                doc.addPage()
                s = { "x": 20, "y": 20, "w": 52, "h": 5, "bd": border }
            }
            if (TypesPee != '1') {
                s = { "x": 25, "y": s['y'] + s['h'], "w": typePeeSize[TypesPee][0], "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(coI + typePeeTxt[TypesPee], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": typePeeSize[TypesPee][1], "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(d.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": 25, "y": s['y'] + s['h'], "w": 13, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(d.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            } else {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(Users['u_type4'] != "ทุน 1 ปี (หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล)" ? "1. หลักสูตรผู้ช่วยทันตแพทย์ 1 ปี" : "1. หลักสูตรผู้ช่วยพยาบาล 1 ปี ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            }

            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('เป็นหลักสูตรที่มีระบบบูรณาการการเรียนรู้กับการทำงาน Work Integrated Learning (WIL) หรือไม่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

            s = { "x": 33, "y": s['y'] + s['h'] + 3, "w": 30, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ไม่เป็น ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_wil == "ไม่เป็น") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("เป็น ในกรณีที่เป็น WIL โปรดระบุรูปแบบ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_wil == "เป็น") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": 33, "y": s['y'] + s['h'], "w": 30, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ทวิภาคี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_wil_type == "ทวิภาคี") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("การฝึกประสบการณ์วิชาชีพ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_wil_type == "การฝึกประสบการณ์วิชาชีพ") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("การฝึกภาคฤดูร้อน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_wil_type == "การฝึกภาคฤดูร้อน") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": 33, "y": s['y'] + s['h'], "w": 15, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_wil_type == "อื่น ๆ") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_wil_type == "อื่น ๆ" ? d.c_wil_type_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            if (TypesPee == 1) {
                s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor("black").text('วิธีดำเนินการที่สอดคล้องกับหลักสูตรสาขา โดยระบุรายวิชาและวิธีการที่ศึกษาในสถานบริการสุขภาพ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                s = { "x": 25, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_continue, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
            }

            s = { "x": 25, "y": TypesPee == 1 ? (voc(doc.y)) : (voc(doc.y) + 6.5), "w": 165, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('วิธีการบริหารจัดการและการติดตามในการนิเทศก์นักศึกษาในสถานประกอบการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();


            s = { "x": 25, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_manage, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });


            s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('การวัดและการประเมินผลสำหรับรายวิชาที่มีการจัดการเรียนการสอนในสถานประกอบการ  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

            s = { "x": 33, "y": s['y'] + s['h'] + 2, "w": 50, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('การสังเกตการณ์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_evaluation1 == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("การสอบวัดความรู้และทักษะ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_evaluation2 == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": 33, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('การร่วมประเมินระหว่างสถานศึกษาและสถานประกอบการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_evaluation3 == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": 33, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_evaluation4 == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_evaluation4 == 'yes' ? d.c_evaluation_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('โดยมีระยะเวลาในการเรียนรู้ในสถานประกอบการเป็นระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

            s = { "x": 43, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_period_week == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_period_week == "yes" ? d.c_week : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 42, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("วันในแต่ละสัปดาห์ จำนวนรวม", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_period_week == "yes" ? d.c_week_sum : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 42, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("ภาคการศึกษา ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

            s = { "x": 43, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_period_semester == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_period_semester == "yes" ? d.c_semester : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("ภาคการศึกษา (อยู่ในสถานประกอบการตลอดภาคการศึกษา) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

            s = { "x": 50, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('โปรดระบุภาคการศึกษาและปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

            const c_data_year = []
            if (d.c_semester1 != '') { c_data_year.push("1/2567") }
            if (d.c_semester2 != '') { c_data_year.push("2/2567") }
            if (d.c_semester3 != '') { c_data_year.push("1/2568") }
            if (d.c_semester4 != '') { c_data_year.push("2/2568") }
            if (d.c_semester5 != '') { c_data_year.push("1/2569") }
            if (d.c_semester6 != '') { c_data_year.push("2/2569") }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_period_semester == "yes" ? c_data_year.join(",") : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



            s = { "x": 43, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            // ------------------- check -----------------//
            if (d.c_period_summer == "yes") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            const c_data2_year = []
            if (d.c_summer1 != '') { c_data2_year.push("3/2567") }
            if (d.c_summer2 != '') { c_data2_year.push("3/2568") }
            if (d.c_summer2 != '') { c_data2_year.push("3/2569") }


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_period_summer == "yes" ? d.c_summer : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("ภาคฤดูร้อนการศึกษา (อยู่ในสถานประกอบการตลอดภาคการศึกษา)  ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

            s = { "x": 50, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('โปรดระบุภาคการศึกษาและปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_period_summer == "yes" ? c_data2_year.join(",") : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('ความร่วมมือกับหน่วยงานภาคเอกชน/ภาคผู้ประกอบการที่สอดคล้อดกับสาขาวิชา/สาขางาน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();



            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่ร่วมมือ 2 ปีที่ผ่านมา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_agency1, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });


            s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่ร่วมมือในปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_agency2, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });

            s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่คาดว่าจะร่วมมือในอนาคต', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_agency3, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });

            if (TypesPee != '1') {

                s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานภาคเอกชน/ภาคผู้ประกอบการที่ส่งผู้รับทุนเข้าฝึกประสบการณ์วิชาชีพ มีจำนวนครูฝึกที่ผ่านการอบรมหลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 }).undash().stroke();

                s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ครูฝึกในสถานประกอบการจากหน่วยงานของรัฐที่เกี่ยวข้อง  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

                s = { "x": 33, "y": s['y'] + s['h'] + 2, "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('มี จำนวน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                // ------------------- check -----------------//
                if (d.c_trainer == "มี") {
                    doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                }
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(d.c_trainer == "มี" ? d.c_trainer_num : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("คน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 }).undash().stroke();

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ไม่มี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                // ------------------- check -----------------//
                if (d.c_trainer == "ไม่มี") {
                    doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                }

                s = { "x": 25, "y": voc(doc.y), "w": 15, "h": 5, "bd": border }
                doc.font(BoldItalic).fontSize(14).fillColor("black").text('หมายเหตุ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 5, "bd": border }
                doc.font(Italic).fontSize(14).fillColor("black").text('โปรดแนบแผนการเรียนในสถานศึกษา แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 }).undash().stroke();
                s = { "x": 25, "y": voc(doc.y), "w": 150, "h": 5, "bd": border }
                doc.font(Italic).fontSize(14).fillColor("black").text('ของหลักสูตรสาขาวิชาในแต่ละระดับชั้นปี (ตามหลักสูตรสาขาที่เสนอขอ) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            }

            if (TypesPee == '5') {
                for await (const dH of CourseHeigh) {
                    if (d.m_id == dH.m_id) {
                        doc.addPage()
                        s = { "x": 25, "y": 20, "w": 74, "h": 5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("โดยจะสามารถศึกษาต่อในระดับ ปวส. หลักสูตรสาขาวิชา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 91, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.mh_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 13, "h": 5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.mh_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('เป็นหลักสูตรที่มีระบบบูรณาการการเรียนรู้กับการทำงาน Work Integrated Learning (WIL) หรือไม่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

                        s = { "x": 33, "y": s['y'] + s['h'] + 3, "w": 30, "h": 5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('ไม่เป็น ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_wil == "ไม่เป็น") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("เป็น ในกรณีที่เป็น WIL โปรดระบุรูปแบบ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_wil == "เป็น") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": 33, "y": s['y'] + s['h'], "w": 30, "h": 5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('ทวิภาคี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_wil_type == "ทวิภาคี") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("การฝึกประสบการณ์วิชาชีพ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_wil_type == "การฝึกประสบการณ์วิชาชีพ") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("การฝึกภาคฤดูร้อน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_wil_type == "การฝึกภาคฤดูร้อน") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": 33, "y": s['y'] + s['h'], "w": 15, "h": 5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_wil_type == "อื่น ๆ") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_wil_type == "อื่น ๆ" ? dH.ch_wil_type_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                        if (TypesPee == 1) {
                            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 5, "bd": border }
                            doc.font(Bold).fontSize(14).fillColor("black").text('วิธีดำเนินการที่สอดคล้องกับหลักสูตรสาขา โดยระบุรายวิชาและวิธีการที่ศึกษาในสถานบริการสุขภาพ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                            s = { "x": 25, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text("       " + dH.ch_continue, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
                        }

                        s = { "x": 25, "y": TypesPee == 1 ? (voc(doc.y)) : (voc(doc.y) + 6.5), "w": 165, "h": 5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('วิธีการบริหารจัดการและการติดตามในการนิเทศก์นักศึกษาในสถานประกอบการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();


                        s = { "x": 25, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("       " + dH.ch_manage, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });


                        s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('การวัดและการประเมินผลสำหรับรายวิชาที่มีการจัดการเรียนการสอนในสถานประกอบการ  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

                        s = { "x": 33, "y": s['y'] + s['h'] + 2, "w": 50, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('การสังเกตการณ์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_evaluation1 == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("การสอบวัดความรู้และทักษะ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_evaluation2 == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": 33, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('การร่วมประเมินระหว่างสถานศึกษาและสถานประกอบการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_evaluation3 == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": 33, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_evaluation4 == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 140, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_evaluation4 == 'yes' ? dH.ch_evaluation_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('โดยมีระยะเวลาในการเรียนรู้ในสถานประกอบการเป็นระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

                        s = { "x": 43, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_period_week == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_period_week == "yes" ? dH.ch_week : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 42, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("วันในแต่ละสัปดาห์ จำนวนรวม", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_period_week == "yes" ? dH.ch_week_sum : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 42, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("ภาคการศึกษา ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

                        s = { "x": 43, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_period_semester == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_period_semester == "yes" ? dH.ch_semester : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("ภาคการศึกษา (อยู่ในสถานประกอบการตลอดภาคการศึกษา) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

                        s = { "x": 50, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('โปรดระบุภาคการศึกษาและปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

                        const c_data_year = []
                        if (dH.ch_semester1 != '') { c_data_year.push("1/2567") }
                        if (dH.ch_semester2 != '') { c_data_year.push("2/2567") }
                        if (dH.ch_semester3 != '') { c_data_year.push("1/2568") }
                        if (dH.ch_semester4 != '') { c_data_year.push("2/2568") }
                        if (dH.ch_semester5 != '') { c_data_year.push("1/2569") }
                        if (dH.ch_semester6 != '') { c_data_year.push("2/2569") }

                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_period_semester == "yes" ? c_data_year.join(",") : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



                        s = { "x": 43, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                        // ------------------- check -----------------//
                        if (dH.ch_period_summer == "yes") {
                            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                        }

                        const c_data2_year = []
                        if (dH.ch_summer1 != '') { c_data2_year.push("3/2567") }
                        if (dH.ch_summer2 != '') { c_data2_year.push("3/2568") }
                        if (dH.ch_summer3 != '') { c_data2_year.push("3/2569") }


                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_period_summer == "yes" ? dH.ch_summer : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("ภาคฤดูร้อนการศึกษา (อยู่ในสถานประกอบการตลอดภาคการศึกษา)  ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

                        s = { "x": 50, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('โปรดระบุภาคการศึกษาและปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_period_summer == "yes" ? c_data2_year.join(",") : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                        doc.font(Bold).fontSize(14).fillColor("black").text('ความร่วมมือกับหน่วยงานภาคเอกชน/ภาคผู้ประกอบการที่สอดคล้อดกับสาขาวิชา/สาขางาน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();



                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่ร่วมมือ 2 ปีที่ผ่านมา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("       " + dH.ch_agency1, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });


                        s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่ร่วมมือในปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("       " + dH.ch_agency2, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });

                        s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่คาดว่าจะร่วมมือในอนาคต', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                        doc.font(ThS).fontSize(14).fillColor("black").text("       " + dH.ch_agency3, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });

                        if (TypesPee != '1') {

                            console.log("---------------------")
                            console.log(dH)

                            s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานภาคเอกชน/ภาคผู้ประกอบการที่ส่งผู้รับทุนเข้าฝึกประสบการณ์วิชาชีพ มีจำนวนครูฝึกที่ผ่านการอบรมหลักสูตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 }).undash().stroke();

                            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text('ครูฝึกในสถานประกอบการจากหน่วยงานของรัฐที่เกี่ยวข้อง  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();

                            s = { "x": 33, "y": s['y'] + s['h'] + 2, "w": 15, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text('มี จำนวน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                            // ------------------- check -----------------//
                            if (dH.ch_trainer == "มี") {
                                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                            }
                            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text(dH.ch_trainer == "มี" ? dH.ch_trainer_num : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
                            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text("คน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 }).undash().stroke();

                            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
                            doc.font(ThS).fontSize(14).fillColor("black").text("ไม่มี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
                            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
                            // ------------------- check -----------------//
                            if (d.c_trainer == "ไม่มี") {
                                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
                            }

                            s = { "x": 25, "y": voc(doc.y), "w": 15, "h": 5, "bd": border }
                            doc.font(BoldItalic).fontSize(14).fillColor("black").text('หมายเหตุ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 5, "bd": border }
                            doc.font(Italic).fontSize(14).fillColor("black").text('โปรดแนบแผนการเรียนในสถานศึกษา แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 }).undash().stroke();
                            s = { "x": 25, "y": voc(doc.y), "w": 150, "h": 5, "bd": border }
                            doc.font(Italic).fontSize(14).fillColor("black").text('ของหลักสูตรสาขาวิชาในแต่ละระดับชั้นปี (ตามหลักสูตรสาขาที่เสนอขอ) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
                        }

                    }
                }
            }

            coI++
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
    }
};

export const PDF14 = async (req) => {
    const MarkerUp = req['MarkerUp'] == null ? [] : req['MarkerUp']
    const MarkerDown = req['MarkerDown'] == null ? [] : req['MarkerDown']
    // console.log("MarkerUp" , MarkerUp)
    // console.log("MarkerDown" , MarkerDown)

    // const SupReflect = req['SupReflect'] == null ? "" : req['SupReflect']
    // const SupReflectOth = req['SupReflectOth'][0] == null ? "" : req['SupReflectOth'][0].sro_data
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


        s = { "x": 20, "y": 20, "w": 170, "h": 5, "bd": border }
        doc.font(Bold).fillColor("black").text('ตัวชี้วัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตัวชี้วัดโครงการ คือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        let Up = [
            ["อัตราการคงอยู่ของนักศึกษาผู้รับทุนในปีที่ 1 ต่อจำนวนนักศึกษาผู้รับทุนทั้งหมด ร้อยละ "],
            ["อัตราการสำเร็จการศึกษาของนักศึกษาผู้รับทุนในระยะเวลา 2 ปี ต่อจำนวนนักศึกษาผู้รับทุนทั้งหมด ร้อยละ "],
            ["นักศึกษาผู้รับทุนได้รับการศึกษาจนสำเร็จการศึกษาในระดับประกาศนียบัตรวิชาชีพ และได้รับการพัฒนาศักยภาพ มีโอกาสชีวิตและอาชีพสามารถพึ่งพาตนเองได้ โดยการเตรียมความพร้อมด้านอาชีพมีความหมายต่อชีวิตจริงของนักศึกษา ตลอดจนได้รับการดูแลสวัสดิภาพ สุขภาพ และพัฒนาทักษะชีวิตที่เหมาะสมสำหรับโลกยุคปัจจุบัน โดยมีอัตราการมีงานทำภายใน 1 ปี ของนักศึกษาผู้รับทุนต่อจำนวนผู้จำนวนนักศึกษาผู้รับทุนที่สำเร็จการศึกษาทั้งหมด ร้อยละ "],
            ["สถานศึกษาสามารถพัฒนาหลักสูตรหรือกระบวนการเรียนการสอนที่ทำให้เกิดสมรรถนะ (Competencies) สอดคล้องกับความต้องการของตลาดแรงงาน รวมถึงการเป็นผู้ประกอบการเอง มีต้นแบบแนวทางในการจัดการศึกษาสายอาชีพที่นำไปต่อยอดได้"],
            ["สถานศึกษาจัดระบบการร่วมงานกับเอกชนหรือแหล่งงานภายนอกเพื่อโอกาสการมีงานทำหรือศึกษาต่อของนักศึกษาหลังจบหลักสูตร"],]
        let kuy = 0
        if (MarkerUp.length > 0) {
            for await (let X of MarkerUp) {
                if (kuy <= 4) {
                    Up[kuy][0] += X.mk_data1
                } else {
                    Up.push(
                        [
                            X.mk_data
                        ]
                    )
                }
                kuy++
            }
        }

        const table0 = {
            headers: [
                { label: "ตัวชี้วัด", headerAlign: "center", align: "left" },
            ],
            rows: Up
        };

        doc.font(Bold).fontSize(12).fillColor('black');
        await doc.table(table0, {
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(160)],
            x: cov(25), y: cov(35)
        });


        let Down = [
            ["สถานศึกษาจัดระบบที่ดีในการดูแลนักศึกษาที่มีพื้นฐานเสียเปรียบเนื่องจากความขาดแคลนทุนทรัพย์และด้อยโอกาสในลักษณะองค์รวม และมีการป้องกันการหลุดออกจากการศึกษา อาทิ"],
            ["- โครงสร้างและบทบาทของคณะทำงานระบบดูแลความเป็นอยู่และสวัสดิภาพของผู้รับทุน"],
            ["- ระบบครูที่ปรึกษา และครูแนะแนว (สุขภาพจิต การเรียน การศึกษาต่อ การมีงานทำ)"],
        ]
        if (MarkerDown.length > 0) {
            for await (let X of MarkerDown) {

                Down.push(
                    [
                        "- " + X.mk_data1
                    ]
                )
            }
        }

        const table1 = {
            headers: [
                { label: "ตัวชี้วัด", headerAlign: "center", align: "left" },

            ],
            rows: Down
        };

        doc.font(Bold).fontSize(12).fillColor('black');
        await doc.table(table1, {
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(160)],
            x: cov(25), y: doc.y
        });




        // s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาที่มีงานทำ ประกอบอาชีพอิสระ หรือการศึกษาต่อในระดับที่สูงขึ้น (เช่น การสำรวจโดยใช้แบบสำรวจ ปี 2565) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


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


export const Pdf1 = async (req, res) => {
    const u_id = req.params.u_id
    const u_type = req.params.u_type
    const u_type2 = req.params.u_type2
    const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await PDF8(data);
    res.send("<iframe width='100%' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
}

export const TestPdf = async (req, res) => {
    const u_id = req.params.u_id
    const u_type = req.params.u_type
    const u_type2 = req.params.u_type2
    const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await PDF13(data);
    res.send("<iframe width='100%' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
}


// export const Pdf1 = async (req, res) => {
// console.log("xxxxxxxxxxxxxxxxxx", req.body)
//     const pdfBase64 = await PDF(req.body);
//     res.send("data:application/pdf;base64," + pdfBase64 + "")
// }

