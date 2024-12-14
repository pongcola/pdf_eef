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
    const ManageMain = req['Person']['ManageMain'][0]
    const MainData = req['Main'][0]
    const MajorData = req['Person']['Major']
    const CeoData = req['Person']['Ceo']
    const ProjectData = req['Person']['Project']
    const ManageData = req['Person']['Manage']
    const EmpData = req['Person']['Emp']
    const Types = 'xxx'
    const TypesPee = '1'
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
    let ceo_period_month = CeoData.p_time_month
    let ceo_day = CeoData.p_day
    let ceo_month = CeoData.p_month
    let ceo_year = CeoData.p_year
    let ceo_exp = CeoData.p_experience
    let ceo_exp_time = CeoData.p_experience_oth
    let ceo_exp_month = CeoData.p_experience_month
    let ceo_work_at1 = CeoData.p_work_at1
    let ceo_work_at2 = CeoData.p_work_at2
    let ceo_work_at2_oth = CeoData.p_work_at2_oth
    let ceo_position = CeoData.p_position

    // ข้อมูลสถานศึกษา

    const school_address = MainData.si_address
    const school_tambon = MainData.si_district
    const school_amphur = MainData.si_district
    const school_province = MainData.si_province
    const school_postcode = MainData.si_zipcode
    const school_tel = MainData.si_tel
    const school_fax = MainData.si_fax
    const school_email = MainData.si_email
    const school_tax = MainData.si_idcard
    const affiliation = MainData.si_member
    const affiliation_oth = MainData.si_member_oth
    const school_type = MainData.si_school_type
    const level_couse1 = MainData.si_level_certi
    const level_couse2 = MainData.si_level_certi_high
    const level_couse3 = MainData.si_level_techno
    const level_couse4 = MainData.si_level_short
    const level_couse6 = MainData.si_level_oth
    const level_couse6_oth = MainData.si_level_assign
    const feature1 = MainData.si_property1
    const feature2 = MainData.si_property2
    const feature3 = MainData.si_property3
    const feature4 = MainData.si_property4
    const total_student = MainData.si_student_all
    const total_teacher = MainData.si_teach_all
    const total_teach = MainData.si_teach_count
    const total_support = MainData.si_support_count
    const total_fulltime = MainData.si_teach_main
    const total_parttime = MainData.si_teach_hire
    const teacher_other = MainData.si_teach_oth
    const totel_teacher_other = MainData.si_teach_assign
    const total_couse1 = MainData.si_count_couse1
    const total_couse1_1 = MainData.si_count_couse1_1
    const total_couse2 = MainData.si_count_couse2
    const total_couse2_1 = MainData.si_count_couse2_1
    const total_couse3 = MainData.si_count_couse3
    const total_couse3_1 = MainData.si_count_couse3_1
    const total_couse5 = MainData.si_count_couse5
    const total_couse5_1 = MainData.si_count_couse5_1
    const total_couse6 = MainData.si_count_couse6
    const total_couse6_1 = MainData.si_count_couse6_1
    const total_extra = MainData.si_teach_special

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
    const res_prefix = ManageMain['p_prefix']
    const res_prefixname_oth = ManageMain['p_prefix_oth']
    const res_name = ManageMain['p_firstname']
    const res_surname = ManageMain['p_lastname']
    const res_id = ManageMain['p_idcard']
    const res_address = ManageMain['p_address']
    const res_tambon = ManageMain['p_district']
    const res_amphur = ManageMain['p_amphur']
    const res_province = ManageMain['p_province']
    const res_postcode = ManageMain['p_zipcode']
    const res_tel = ManageMain['p_tel']
    const res_email = ManageMain['p_email']
    const res_line = ManageMain['p_lineid']
    const res_period = ManageMain['p_time']
    const res_day = ManageMain['p_day']
    const res_month = ManageMain['p_month']
    const res_year = ManageMain['p_year']
    const res_exp = ManageMain['p_experience']
    const res_exp_time = ManageMain['p_experience_oth']
    const res_exp_month_time = ManageMain['p_experience_month']
    const res_position = ManageMain['p_position']
    const res_subject = ManageMain['p_subject']
    const res_branch = ManageMain['p_branch']
    const res_level_couse1 = ManageMain['p_level_certi1']
    const res_level_couse2 = ManageMain['p_level_certi2']
    const res_level_couse3 = ManageMain['p_level_certi3']
    const res_level_couse4 = ManageMain['p_level_certi_high1']
    const res_level_couse5 = ManageMain['p_level_certi_high2']
    const res_level_couse6 = ManageMain['p_level_anu1']
    const res_level_couse7 = ManageMain['p_level_anu2']
    const res_level_couse8 = ManageMain['p_level_oth']
    const res_level_couse8_oth = ManageMain['p_level_assign']
    const res_level_couse9 = ManageMain['p_level_bachelor']
    const res_level_couse10 = ManageMain['p_level_master_degree']
    const res_level_couse11 = ManageMain['p_level_doctoral_degree']
    const res_level_couse12 = ManageMain['p_level_certi1y']
    const res_work_at1 = ManageMain['p_work_at1']
    const res_work_at2 = ManageMain['p_work_at2']
    const res_work_at2_oth = ManageMain['p_work_at2_oth']

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
    const fn_exp_time_month = EmpData['p_experience_month'];

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


        doc.font(Bold).fontSize(20).fillColor('black');


        doc.rect(0, 0, cov(211), cov(60)).fill('#ffe699');


        s = { "x": 20, "y": 20, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('แบบเสนอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'] + 2, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('“โครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ” ปี 2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'] + 2, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('กองทุนเพื่อความเสมอภาคทางการศึกษา (กสศ.)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



        doc.font(Bold).fontSize(16).fillColor('black');
        s = { "x": 20, "y": s['y'] + s['h'] + 20, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('คำอธิบาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 146, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ก่อนจัดทำแบบเสนอโครงการสถานศึกษาควรศึกษาประกาศสำนักงานกองทุนเพื่อความเสมอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.46 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 156, "h": 6.5, "bd": border }

        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ภาคทางการศึกษา เรื่อง เปิดรับข้อเสนอโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ความต้องการพิเศษ ปี 2567 อย่างละเอียด และยื่นแบบเสนอโครงการผ่านระบบออนไลน์ที่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 13, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("เว็บไซต์ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("https://eefinnovet-special.com/", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.51 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 83, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("โดยกรอกข้อมูลและส่งเอกสารตามกำหนดให้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ครบถ้วน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 155, "h": 6.5, "bd": border }

        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 146, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("แบบเสนอโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ปี 2567", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 156, "h": 6.5, "bd": border }


        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("ประกอบด้วย 3 ส่วน ได้แก่ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไป ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ส่วนที่ 2 รายละเอียดโครงการ  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ส่วนที่ 3 คำรับรอง  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 30, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor("black").text('3.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 147, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("สถานศึกษาควรศึกษาเอกสาร และกรอกข้อมูลให้ครบถ้วนชัดเจนเพื่อประโยชน์ต่อการพิจารณา ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 156, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(16).fillColor('black').text("และตรวจสอบความถูกต้องของเอกสารก่อนการยื่นข้อเสนอโครงการผ่านระบบออนไลน์ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });


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
        doc.font(ThS).fillColor("black").text('การยื่นแบบเสนอโครงการขอให้ผ่านระบบออนไลน์ที่เว็บไซต์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        // doc.moveTo(cov(129), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 21), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่วันที่ 29 มกราคม – 15 กุมภาพันธ์ 2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('https://eefinnovet-special.com/ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(77), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 62), cov(s['y'] + s['h'] - 1)).dash(1, { space: 0.01 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('สอบถามข้อมูลเพิ่มเติม  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('   โทร. 02-079-5475 กด 2 ในวันและเวลาราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



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



        doc.lineWidth(0).stroke();
        s = { "x": 20, "y": 20, "w": 170, "h": 6.5, "bd": border }
        doc.fontSize(14).font(Bold).fillColor("black").text('ส่วนที่ 1 ข้อมูลทั่วไป', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(89), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w'] - 69), cov(s['y'] + s['h'] - 2)).dash(1, { space: 0.01 }).stroke()



        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ชื่อโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 200, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('“โครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ” ปี 2567 ประเภททุน 2 ปี (ปวส.)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.65 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 166, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text(`ของ`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

        doc.font(ThS).fontSize(14).fillColor("black").text(`${Users.u_school}`, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
        doc.moveTo(cov(s['x']+7), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("ข้อมูลสถานศึกษาผู้เสนอโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 121, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ในกรณีที่สถานศึกษามีเขตพื้นที่หรือวิทยาเขตหรือมีลักษณะอื่นที่คล้ายคลึงเขตพื้นที่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.50 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor("black").text('หรือวิทยาเขต ให้เสนอโครงการในนามสถานศึกษาเท่านั้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('ชื่อสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 145, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่ตั้ง: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_district, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
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


        s = { "x": 25, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรสาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_fax, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('เลขประจำตัวผู้เสียภาษี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_idcard, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สังกัด ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("          สำนักงานคณะกรรมการการอาชีวศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();


        s = { "x": 35, "y": s['y'] + s['h'], "w": 130, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('          สถาบันวิทยาลัยชุมชน กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 35, "y": s['y'] + s['h'], "w": 130, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('          กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 35, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('          อื่น ๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        doc.lineWidth(0).stroke();
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(MainData.si_member == "อื่น ๆ" ? MainData.si_member_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        if (MainData.si_member == "สำนักงานคณะกรรมการการอาชีวศึกษา") {
            doc.image('img/check.png', cov(38), cov(92), { width: cov(5), height: cov(5) })
        } else if (MainData.si_member == "สถาบันวิทยาลัยชุมชน กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม") {
            doc.image('img/check.png', cov(38), cov(98.5), { width: cov(5), height: cov(5) })
        } else if (MainData.si_member == "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม") {
            doc.image('img/check.png', cov(38), cov(105), { width: cov(5), height: cov(5) })
        } else if (MainData.si_member == "อื่น ๆ") {
            doc.image('img/check.png', cov(38), cov(111.5), { width: cov(5), height: cov(5) })
        }


        doc.lineWidth(0).stroke();
        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประเภทสถานศึกษา                   รัฐ                   เอกชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineCap('square').circle(cov(s['x'] + 40), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 65), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        if (MainData.si_school_type == "รัฐ") {
            doc.image('img/check.png', cov(63), cov(118), { width: cov(5), height: cov(5) })
        } else if (MainData.si_school_type == "เอกชน") {
            doc.image('img/check.png', cov(88), cov(118), { width: cov(5), height: cov(5) })
        }

        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('ระดับการศึกษาที่เปิดสอน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 95, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตรวิชาชีพ (ปวช.)  จำนวนสาขาวิชาหรือหลักสูตรที่เปิดสอน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse5, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("หลักสูตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 32, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse5_1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) จำนวนสาขาวิชาหรือหลักสูตรที่เปิดสอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("หลักสูตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 32, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse1_1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 99, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ปริญญาตรีสายเทคโนโลยีปฏิบัติการ จำนวนสาขาวิชาหรือหลักสูตรที่เปิดสอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse2, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("หลักสูตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 32, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse2_1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        s = { "x": 35, "y": s['y'] + s['h'], "w": 83, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หลักสูตรอาชีพระยะสั้น จำนวนสาขาวิชาหรือหลักสูตรที่เปิดสอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("หลักสูตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 32, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปี ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_couse3_1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ ระบุ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(level_couse6 == "อื่น ๆ" ? level_couse6_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 35, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("จำนวนสาขาวิชาหรือหลักสูตรที่เปิดสอน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(level_couse6 == "อื่น ๆ" ? total_couse6 : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("หลักสูตร จำนวนนักศึกษาทุกชั้นปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(level_couse6 == "อื่น ๆ" ? total_couse6_1 : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        if (level_couse1 != '') {
            doc.image('img/check.png', cov(28), cov(130), { width: cov(5), height: cov(5) })
        }
        if (level_couse2 != '') {
            doc.image('img/check.png', cov(28), cov(143), { width: cov(5), height: cov(5) })
        }
        if (level_couse3 != '') {
            doc.image('img/check.png', cov(28), cov(156), { width: cov(5), height: cov(5) })
        }
        if (level_couse4 != '') {
            doc.image('img/check.png', cov(28), cov(169), { width: cov(5), height: cov(5) })
        }

        if (level_couse6 != '') {
            doc.image('img/check.png', cov(28), cov(182), { width: cov(5), height: cov(5) })
        }




        s = { "x": 35, "y": s['y'] + s['h'], "w": 42, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("จำนวนนักศึกษาทั้งสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 45, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("จำนวนครู อาจารย์ทั้งสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_teacher, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 63, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนครู อาจารย์ที่ทำหน้าที่สอนในสถานศึกษา ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_teach, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน แบ่งออกเป็น  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ครู อาจารย์ประจำ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_fulltime, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน ครู อาจารย์อัตราจ้าง ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_parttime, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อาจารย์พิเศษ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_extra, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 35, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ (โปรดระบุ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(teacher_other != '' ? teacher_other : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(teacher_other != '' ? totel_teacher_other : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 35, "y": s['y'] + s['h'], "w": 66, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('จำนวนบุคคลากรสายสนับสนุนที่ไม่ได้ทำหน้าที่สอน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(total_support, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('คน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


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
        doc.lineWidth(0).stroke();

        // doc.rect(cov(20), cov(20), cov(171), cov(255)).fill('#ffe699');
        s = { "x": 20, "y": 20, "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('3.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("รายชื่อคณะทำงานของสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 100, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("3.1 ผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((ceo_prefix == "อื่น ๆ" ? ceo_prefixname_oth : ceo_prefix) + " " + ceo_name + " " + ceo_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตําแหน่งปัจจุบัน (ทางวิชาการ/ราชการ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 114, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
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


        s = { "x": 25, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        s = { "x": 25, "y": s['y'] + s['h'], "w": 110, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ระยะเวลาในการดำรงตำแหน่งผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี ณ แห่งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_period + " ปี " + ceo_period_month + " เดือน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตั้งแต่ (วัน/เดือน/ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_day + "/" + ceo_month + "/" + ceo_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ถึงปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.6 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('       ไม่มี          มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });

        doc.lineCap('square').circle(cov(s['x'] + 2), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 18), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_exp_time + " ปี " + ceo_exp_month + " เดือน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        if (ceo_exp == "มี") {
            doc.image('img/check.png', cov(41), cov(s['y']), { width: cov(5), height: cov(5) })
        } else {
            doc.image('img/check.png', cov(25), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 25, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                     สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_work_at2_oth != '' ? ceo_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        if (ceo_work_at1 != '') {
            doc.image('img/check.png', cov(53), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
        }
        if (ceo_work_at2 != '') {
            doc.image('img/check.png', cov(53), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 25, "y": s['y'] + s['h'], "w": 38, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("3.2 ผู้รับผิดชอบโครงการ**", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 133, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผู้ดำเนินการหลักของโครงการ/ผู้มีอำนาจลงนามถอนเงินหลัก โดยเป็นผู้ที่มีบทบาทหน้าที่ในการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 167, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('บริหารจัดการโครงการและงบประมาณ หรือเป็นผู้รับผิดชอบโครงการที่ผู้บริหารมอบหมาย ต้องเป็นระดับผู้บริหารสถานศึกษา ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 88, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('หรือไม่ต่ำกว่าระดับหัวหน้าแผนกที่เกี่ยวข้องกับสาขาที่ยื่นเสนอขอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.font(BoldItalic).fillColor("black").text('โปรดแนบประวัติผู้รับผิดชอบโครงการโดยย่อ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(') ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.15 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((res_prefix == "อื่น ๆ" ? res_prefixname_oth : res_prefix) + " " + res_name + " " + res_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(ceo_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตําแหน่งปัจจุบัน (ทางวิชาการ/ราชการ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 114, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สาขาวิชาที่เชี่ยวชาญ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_branch, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'] + 6.5, "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('วิชาที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 151, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_subject, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'] + 6.5, "w": 35, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระดับชั้นที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();;

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse1 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse2 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse3 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }


        s = { "x": 60, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse4 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse5 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse6 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse7 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }


        s = { "x": 60, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ประกาศนียบัตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse12 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse9 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาโท', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse10 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาเอก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse11 != '') {
            //------------------ check ------------------//
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 60, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        if (res_level_couse8 != '') {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 115, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_level_couse8_oth != '' ? res_level_couse8_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        s = { "x": 25, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
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


        s = { "x": 25, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        // s = { "x": 25, "y": s['y'] + s['h'], "w": 110, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ระยะเวลาในการดำรงตำแหน่งผู้บริหารสถานศึกษา/ผู้อำนวยการ/อธิการบดี ณ แห่งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text(res_period, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        // s = { "x": 25, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ตั้งแต่ (วัน/เดือน/ปี)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text(res_day + "/" + res_month + "/" + res_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ถึงปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.6 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('       ไม่มี          มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });

        doc.lineCap('square').circle(cov(s['x'] + 2), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 18), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_exp_time + " ปี " + res_exp_month_time + " เดือน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        if (res_exp == "มี") {
            doc.image('img/check.png', cov(41), cov(s['y']), { width: cov(5), height: cov(5) })
        } else {
            doc.image('img/check.png', cov(25), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 25, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                     สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(res_work_at2_oth != '' ? res_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        if (res_work_at1 != '') {
            doc.image('img/check.png', cov(53), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
        }
        if (res_work_at2 != '') {
            doc.image('img/check.png', cov(53), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        // const Rs = ["1", "2", "3", "4"];
        // console.log("ManageData", ManageData)
        for await (const coM of ManageData) {
            // console.log("coM", coM)
            if ((countManage % 2) == 1) {

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
                // doc.rect(cov(20), cov(20), cov(171), cov(255)).fill('#ffe699');
                doc.lineWidth(0).stroke();
                s = { "x": 25, "y": 20, "w": 100, "h": 6.5, "bd": border }
            } else {
                doc.lineWidth(0).stroke();
                s = { "x": 25, "y": s['y'] + s['h'], "w": 100, "h": 6.5, "bd": border }
            }

            doc.font(Bold).fontSize(14).fillColor('black').text("3." + (countManage + 2) + " ผู้ช่วยผู้รับผิดชอบโครงการ คนที่ " + countManage, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": 25, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text((coM.p_prefix == "อื่น ๆ" ? coM.p_prefix_oth : coM.p_prefix) + coM.p_firstname + " " + coM.p_lastname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_idcard, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



            s = { "x": 25, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ตําแหน่งปัจจุบัน (ทางวิชาการ/ราชการ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 114, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('สาขาวิชาที่เชี่ยวชาญ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_branch, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'] + 6.5, "w": 15, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('วิชาที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 151, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_subject, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'] + 6.5, "w": 35, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ระดับชั้นที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();;

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();


            //------------------ check ------------------//
            if (coM.p_level_certi1 == "ปวช.1") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_certi2 == "ปวช.2") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_certi3 == "ปวช.3") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }


            s = { "x": 60, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_certi_high1 == "ปวส.1") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_certi_high2 == "ปวส.2") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_anu1 == "อนุปริญญาปีที่ 1") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_anu2 == "อนุปริญญาปีที่ 2") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }


            s = { "x": 60, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ประกาศนียบัตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_certi1y == "ประกาศนียบัตร") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_bachelor == "ปริญญาตรี") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาโท', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_master_degree == "ปริญญาโท") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาเอก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_doctoral_degree == "ปริญญาเอก") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }



            s = { "x": 60, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
            //------------------ check ------------------//
            if (coM.p_level_oth == "อื่น ๆ") {
                doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 115, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_level_oth == "อื่น ๆ" ? coM.p_level_assign : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



            s = { "x": 25, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_district, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('อำเภอ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_zipcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 25, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_lineid, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 25, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูงของ กสศ.          ไม่มี          มี ระยะเวลา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
            doc.lineCap('square').circle(cov(s['x'] + 105), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            doc.lineCap('square').circle(cov(s['x'] + 121), cov(s['y'] + 3), cov(2.5)).undash().stroke();

            if (coM.p_experience == "ไม่มี") {
                doc.image('img/check.png', cov(s['x'] + 103), cov(s['y']), { width: cov(5), height: cov(5) })
            } else {
                doc.image('img/check.png', cov(s['x'] + 119), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_experience == "มี" ? (coM.p_experience_oth + " ปี " + coM.p_experience_month + " เดือน") : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
            // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });



            // s = { "x": 25, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
            // doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.6 });
            // s = { "x": 25, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
            // doc.font(ThS).fillColor("black").text('       ไม่มี          มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });

            // doc.lineCap('square').circle(cov(s['x'] + 2), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            // doc.lineCap('square').circle(cov(s['x'] + 18), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            // doc.font(ThS).fontSize(14).fillColor('black').text("xxxxx", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
            // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            //------------------ check ------------------//
            // if (coM.p_experience == "ไม่มี") {
            //     doc.image('img/check.png', cov(25), cov(s['y']), { width: cov(5), height: cov(5) })
            // } else {
            //     doc.image('img/check.png', cov(41), cov(s['y']), { width: cov(5), height: cov(5) })
            // }



            s = { "x": 25, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
            doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();

            s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
            doc.font(ThS).fillColor("black").text('                                     สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
            doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(coM.p_work_at2 != '' ? coM.p_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            //------------------ check ------------------//
            if (coM.p_work_at1 != '') {
                doc.image('img/check.png', cov(53), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
            }
            //------------------ check ------------------//
            if (coM.p_work_at2 != '') {
                doc.image('img/check.png', cov(53), cov(s['y']), { width: cov(5), height: cov(5) })
            }
            countManage++
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
        const main_subject = ProjectData['p_subject'];
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
        const main_exp_time_month = ProjectData['p_experience_month'];


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
        // doc.rect(cov(20), cov(20), cov(171), cov(255)).fill('#ffe699');
        doc.lineWidth(0).stroke();

        s = { "x": 25, "y": 20, "w": 47, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text("3." + (countManage + 2) + ' ประสานงานหลักของโครงการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 123, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผู้ที่มีบทบาทหน้าที่ในการประสานงานการดำเนินการกับกองทุนเพื่อความเสมอภาค", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.49 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ทางการศึกษา (กสศ.) เช่น การนัดหมายการประชุม การจัดกิจกรรม การนำส่งผลงานประกอบการเบิกเงินงวด ฯลฯ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((main_prefix == "อื่น ๆ" ? main_prefixname_oth : main_prefix) + " " + main_name + " " + main_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 52, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตําแหน่งปัจจุบัน (ทางวิชาการ/ราชการ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 114, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('สาขาวิชาที่เชี่ยวชาญ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_branch, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'] + 6.5, "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('วิชาที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 151, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_subject, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 4.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 4.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'] + 6.5, "w": 35, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระดับชั้นที่สอน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();;

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse1 == "ปวช.1") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse2 == "ปวช.2") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวช.3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse3 == "ปวช.3") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }


        s = { "x": 60, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse4 == "ปวส.1") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปวส.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse5 == "ปวส.2") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse6 == "อนุปริญญาปีที่ 1") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อนุปริญญาปีที่ 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse7 == "อนุปริญญาปีที่ 2") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }


        s = { "x": 60, "y": s['y'] + s['h'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ประกาศนียบัตร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse12 == "ประกาศนียบัตร") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาตรี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse9 == "ปริญญาตรี") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาโท', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse10 == "ปริญญาโท") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ปริญญาเอก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse11 == "ปริญญาเอก") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 60, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('อื่น ๆ ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();
        //------------------ check ------------------//
        if (main_level_couse8 == "อื่น ๆ") {
            doc.image('img/check.png', cov(s['x'] - 8), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 115, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_level_couse8 == "อื่น ๆ" ? main_level_couse8_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
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


        s = { "x": 25, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.6 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('       ไม่มี          มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });

        doc.lineCap('square').circle(cov(s['x'] + 2), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 18), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_exp == "มี" ? main_exp_time + "ปี " + main_exp_time_month + " เดือน " : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        if (main_exp == "ไม่มี") {
            doc.image('img/check.png', cov(25), cov(s['y']), { width: cov(5), height: cov(5) })
        } else {
            doc.image('img/check.png', cov(41), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 25, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                     สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(main_work_at2 == "สถานศึกษาอื่น" ? main_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        if (main_work_at1 == "สถานศึกษาที่ยื่นข้อเสนอโครงการ") {
            doc.image('img/check.png', cov(53), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
        }
        if (main_work_at2 == "สถานศึกษาอื่น") {
            doc.image('img/check.png', cov(53), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        countManage++

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
        // doc.rect(cov(20), cov(20), cov(171), cov(255)).fill('#ffe699');
        doc.lineWidth(0).stroke();

        s = { "x": 25, "y": 20, "w": 47, "h": 6.5, "bd": border }

        doc.font(Bold).fontSize(14).fillColor("black").text("3." + (countManage + 2) + ' เจ้าหน้าที่การเงินโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 123, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(ผู้ที่มีความรู้และความสามารถด้านการจัดทำบัญชี รายงานการเงิน โดยมีบทบาทหน้าที่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.29 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ด้านการเงิน เช่น การเบิกเงินงวด การจัดทำบัญชีรายงานการเงิน การตรวจสอบบัญชี โดยเป็นเจ้าหน้าที่การเงินของสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.105 });
        doc.moveTo(cov(s['x'] + 111), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).undash().stroke();

        s = { "x": 25, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ที่ได้รับมอบหมายเท่านั้น) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.105 }).undash().stroke();
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).undash().stroke();

        s = { "x": 25, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ชื่อ-นามสกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text((fn_prefix == "อื่น ๆ" ? fn_prefixname_oth : fn_prefix) + " " + fn_name + " " + fn_surname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 44, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('หมายเลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_id, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 16, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ที่อยู่: เลขที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 87, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 54, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
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


        s = { "x": 25, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โทรศัพท์ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_tel, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11.5, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Line ID', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_line, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 9, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('Email ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()



        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text("ตำแหน่งทางวิชาการ/ราชการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text("ระยะเวลาดำรงตำแหน่ง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        // doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('ประสบการณ์ในการบริหารโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ของ กสศ. ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.6 });
        s = { "x": 25, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('       ไม่มี          มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });

        doc.lineCap('square').circle(cov(s['x'] + 2), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        doc.lineCap('square').circle(cov(s['x'] + 18), cov(s['y'] + 3), cov(2.5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_exp == "ไม่มี" ? "" : fn_exp_time + "ปี " + fn_exp_time_month + " เดือน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 7, "h": 6.5, "bd": border }
        // doc.font(ThS).fillColor("black").text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        if (fn_exp == "ไม่มี") {
            doc.image('img/check.png', cov(25), cov(s['y']), { width: cov(5), height: cov(5) })
        } else {
            doc.image('img/check.png', cov(41), cov(s['y']), { width: cov(5), height: cov(5) })
        }



        s = { "x": 25, "y": s['y'] + s['h'], "w": 142, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('โดยได้ดำเนินงานใน         สถานศึกษาที่ยื่นข้อเสนอโครงการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 68, "h": 6.5, "bd": border }
        doc.font(ThS).fillColor("black").text('                                     สถานศึกษาอื่น ระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        doc.lineJoin('miter').rect(cov(53), cov(s['y']), cov(5), cov(5)).undash().stroke();
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(fn_work_at2 == "สถานศึกษาอื่น" ? fn_work_at2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        //------------------ check ------------------//
        if (fn_work_at1 == "สถานศึกษาที่ยื่นข้อเสนอโครงการ") {
            doc.image('img/check.png', cov(53), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
        }
        //------------------ check ------------------//
        if (fn_work_at2 == "สถานศึกษาอื่น") {
            doc.image('img/check.png', cov(53), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 20, "y": s['y'] + s['h'] + 10, "w": 20, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('หมายเหตุ   ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 71.5, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("* ผู้อำนวยการสถานศึกษาและผู้รับผิดชอบโครงการเป็นคนเดียวกันได้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("** ผู้รับผิดชอบโครงการและผู้ประสานงานของโครงการเป็นคนเดียวกันได้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


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

        const AnyToon = req['AnyToon']
        const Toon = req['Toon']
        const SuportChk = req['SuportChk']['0'] == null ? "" : req['SuportChk']['0']
        const TypesPee = req['TypesPee']
        // doc.rect(cov(20), cov(20), cov(171), cov(255)).fill('#ffe699');
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text(TypesPee == 1 ? '5.' : '5.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 180, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานศึกษาเคยรับทุนสนับสนุนของ กสศ. หรือไม่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุน กสศ. ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           ไม่เคยรับทุน กสศ. ระบุเหตุผล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineCap('square').circle(cov(s['x'] + 5), cov(s['y'] + 3), cov(2.5)).undash().stroke();


        if (SuportChk.school_received != "ไม่เคยรับทุน") {
            doc.image('img/check.png', cov(s['x'] + 3), cov(s['y'] - 6.5), { width: cov(5), height: cov(5) })
        } else {
            doc.image('img/check.png', cov(s['x'] + 3), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 20, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง หรือ ทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(s['x'] + 2.5), cov(s['y']), cov(5), cov(5)).undash().stroke();
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

        if (SuportChk.spc_ever_fund == "เคยรับทุน กสศ. (ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง)") {
            doc.image('img/check.png', cov(s['x'] + 3), cov(s['y']), { width: cov(5), height: cov(5) })
        }


        s = { "x": 20, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           เคยรับทุนนวัตกรรมสายอาชีพชั้นสูง หรือ ทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ของ กสศ. โดยขอให้ข้อมูลความสำเร็จในการส่งเสริมและสนับสนุนนักศึกษาทุน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        doc.lineJoin('miter').rect(cov(s['x'] + 2.5), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (SuportChk.spc_ever_innovation == "เคยรับทุนนวัตกรรมสายอาชีพชั้นสูง ของ กสศ.") {
            doc.image('img/check.png', cov(s['x'] + 3), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 20, "y": s['y'] + s['h'], "w": 260, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("           การพัฒนานวัตกรรมการเรียนการสอน ความร่วมมือกับสถานประกอบการ การส่งเสริมการมีงานทำของสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'], "w": 170, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("                                                   " + (SuportChk.school_received_oth != null ? SuportChk.school_received_oth : ""), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
        if (SuportChk.school_received == "ไม่เคยรับทุน") {
            doc.image('img/check.png', cov(33), cov(92), { width: cov(5), height: cov(5) })
        }
        let rowLast = doc.y
        if (SuportChk.spc_ever_fund == "เคยรับทุน กสศ. (ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง)") {
            if (AnyToon != null) {
                let pD3 = [];
                for await (let X of AnyToon) {
                    pD3.push(
                        [
                            X.sp_name.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_year.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            // X.sp_success.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        ],
                    )
                }
                const table3 = {
                    title: "ทุนอื่นที่ไม่ใช่ทุนนวัตกรรมสายอาชีพชั้นสูง",
                    headers: [
                        { label: "ชื่อทุน", headerAlign: "center", align: "left" },
                        { label: "ปีที่รับทุน", headerAlign: "center", align: "center" },
                        // { label: "ความสำเร็จของการบริหารโครงการ", headerAlign: "center", align: "left" },
                    ],
                    rows: pD3,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table3, {

                    columnSpacing: 2,
                    padding: 2,
                    prepareHeader: (x) => {

                        doc.font(Bold).fontSize(12).fillColor('black')
                    },
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        if (indexColumn === 0) {
                            doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                        }
                        doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();



                        doc.font(ThS).fontSize(12).fillColor('black')
                        console.log(rectRow)
                        rowLast = rectRow.y + cov(15)
                    },
                    columnsSize: [cov(235), cov(20)],
                    x: cov(20), y: doc.y
                });
            }
        }

        if (SuportChk.spc_ever_innovation == "เคยรับทุนนวัตกรรมสายอาชีพชั้นสูง ของ กสศ.") {
            if (Toon != null) {
                let pD4 = [];
                for await (let X of Toon) {
                    pD4.push(
                        [
                            X.sp_name.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_type.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_year.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            new Intl.NumberFormat('th-Th', { maximumSignificantDigits: 3 }).format(
                                X.sp_budget,
                            ) + " บาท",
                            X.sp_target.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                            X.sp_time + " ปี",
                            X.sp_success.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                        ],
                    )
                }
                const table4 = {
                    title: "ทุนนวัตกรรมสายอาชีพชั้นสูง",
                    headers: [
                        { label: "ชื่อโครงการ", headerAlign: "center", align: "left" },
                        { label: "ประเภททุน", headerAlign: "center", align: "left" },
                        { label: "ปีที่ได้รับทุน", headerAlign: "center", align: "center" },
                        { label: "งบประมาณรวม", headerAlign: "center", align: "center" },
                        { label: "กลุ่มเป้าหมาย", headerAlign: "center", align: "center" },
                        { label: "ระยะเวลาโครงการ", headerAlign: "center", align: "center" },
                        { label: "ความสำเร็จของโครงการ", headerAlign: "center", align: "left" },
                    ],
                    rows: pD4,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                await doc.table(table4, {
                    columnSpacing: 2,
                    padding: 2,
                    prepareHeader: (x) => {
                        doc.font(Bold).fontSize(12).fillColor('black')
                        
                    },
                    prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                        if (indexColumn === 0) {
                            doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                        }
                        doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                        doc.font(ThS).fontSize(12).fillColor('black')
                    },
                    columnsSize: [cov(50), cov(30), cov(20), cov(20), cov(20), cov(25), cov(95)],
                    x: cov(20), y: rowLast
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
        return null
    }
};

export const PDF3 = async (req) => {

    const MainMajor = req['Major']
    const TotalFund = req['TotalFund']
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


        s = { "x": 20, "y": 20, "w": 170, "h": 257, "bd": border }
        doc.fontSize(24).font(Bold).fillColor("black").text('ส่วนที่ 2 รายละเอียดโครงการ', cov(s['x']), cov(143.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });



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

        doc.font(Bold).fontSize(16).fillColor('black');
        // doc.rect(cov(20), cov(20), cov(171), cov(255)).fill('#ffe699');
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('1.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("กลุ่มเป้าหมาย : ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 48, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("นักศึกษาทุน 2 ปี ปวส. จำนวนรวม ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(TotalFund[0].TotalFund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 84, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน (ระบุชื่อหลักสูตรสาขาที่ได้รับการอนุมัติ โดยสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('เสนอรายชื่อหลักสูตรสาขาวิชาไม่เกิน 3 หลักสูตรสาขา และจะต้องมีผู้รับทุนรวมไม่น้อยกว่า 10 คน และไม่เกินกว่า 20 คน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.22 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 5, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('2.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 41, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สาขาวิชาที่สถานศึกษาเสนอ : ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 124, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("สาขาที่ท่านเห็นว่ามีศักยภาพในการจัดการเรียนการสอน ทั้งนี้สามารถเสนอจำนวนหลักสูตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("สาขาไม่เกิน 3 สาขา โปรดระบุหลักสูตรสาขา ดังนี้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });
        doc.moveTo(cov(s['x'] + 8), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w'] - 138), cov(s['y'] + s['h'] - 1)).undash().stroke()




        let loop = [1, 2];
        let chkRow = 0
        for await (let [k, y] of Object.entries(MainMajor)) {
            // console.log("------------", k, y)
            if (chkRow >= 1) {

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
                s = { "x": 33, "y": 20, "w": 53, "h": 5, "bd": border }
            } else {
                s = { "x": 33, "y": s['y'] + s['h'], "w": 53, "h": 6.5, "bd": border }
            }

            doc.image('img/check.png', cov(s['x'] - 7.5), cov(s['y']), { width: cov(5), height: cov(5) })
            doc.font(ThS).fontSize(14).fillColor("black").text('2.' + (chkRow + 1) + ' ปวส./อนุปริญญา หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            doc.lineJoin('miter').rect(cov(s['x'] - 8), cov(s['y']), cov(5), cov(5)).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 105, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(y.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'], "w": 13, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(y.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("โดยเปิดสอนมาแล้ว", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(y.md_total_open, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


            s = { "x": 25, "y": s['y'] + s['h'], "w": 27, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("จำนวนทุนที่เสนอขอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(y.m_fund, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


            s = { "x": 25, "y": s['y'] + s['h'], "w": 166, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('กลุ่มวิชา       อุตสาหกรรม       เกษตรกรรม       บริการ       สาขาวิชาหรือหลักสูตรที่มีความต้องการของตลาดแรงงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });

            doc.lineCap('square').circle(cov(41), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            if (y.m_subject == "อุตสาหกรรม") {
                doc.image('img/check.png', cov(41 - 2), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            doc.lineCap('square').circle(cov(67), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            if (y.m_subject == "เกษตรกรรม") {
                doc.image('img/check.png', cov(67 - 2), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            doc.lineCap('square').circle(cov(91.5), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            if (y.m_subject == "บริการ") {
                doc.image('img/check.png', cov(91.5 - 2), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            doc.lineCap('square').circle(cov(109.5), cov(s['y'] + 3), cov(2.5)).undash().stroke();
            if (y.m_subject == "สาขาวิชาหรือหลักสูตรที่มีความต้องการของตลาดแรงงานในท้องถิ่นหรือจังหวัดที่สถานศึกษาตั้งอยู่") {
                doc.image('img/check.png', cov(109.5 - 2), cov(s['y']), { width: cov(5), height: cov(5) })
            }

            s = { "x": 25, "y": s['y'] + s['h'], "w": 166, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ในท้องถิ่นหรือจังหวัดที่สถานศึกษาตั้งอยู่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });
            s = { "x": 25, "y": s['y'] + s['h'], "w": 166, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('รายละเอียดเกี่ยวกับหลักสูตรสาขาวิชา/สาขางาน (เช่น ขอบเขตเนื้อหาหลักสูตร ความสำคัญ วัตถุประสงค์) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 });
            s = { "x": 25, "y": s['y'] + s['h'], "w": 166, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('       ' + y.md_sc_detail_course.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.28 });

            s = { "x": 25, "y": voc(doc.y), "w": 166, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ขอให้แนบเอกสารหลักสูตรรายวิชาชีพเฉพาะที่เสนอขอเท่านั้น ไม่รวมหมวดวิชาศึกษาทั่วไป ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
            let chkX = 0
            for await (let dataY of y.years) {
                chkX++
                console.log(voc(doc.y))
                if (voc(doc.y) > 210) {
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
                }
                // console.log("------------", dataY)
                s = { "x": 35, "y": voc(doc.y), "w": 73, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('จำนวนนักศึกษาทุกชั้นปีที่ศึกษา ณ ปี ' + dataY.md_year + ' ในสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_total_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 58, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('มีนักศึกษาที่มีความต้องการพิเศษ จำนวน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_special_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน โดยเป็นผู้เรียนที่มีลักษณะดังนี้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางการเห็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_blind_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางการได้ยินหรือสื่อความหมาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_deaf_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางการเคลื่อนไหวหรือทางร่างกาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_physical_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางจิตใจหรือพฤติกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_mind_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางสติปัญญา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_wit_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางการเรียนรู้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_learning_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ความพิการทางออทิสติก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(dataY.md_autism_student, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            }

            chkRow++

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
    const TypesPee = req['TypesPee']
    const Manage = req['Manage']
    const Problem = req['Problem']
    const MainMajor = req['Major']
    const Area = req['Area']
    const Survey = req['Survey'][0]
    console.log("Survey : ", Survey)
    const SupReflect = req['SupReflect'] == null ? "" : req['SupReflect']
    const SupReflectOth = req['SupReflectOth'] == null ? "" : req['SupReflectOth'][0].sro_data
    const SupReflectOth2 = req['SupReflectOth'] == null ? "" : req['SupReflectOth'][0].sro_ref


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
        s = { "x": 25, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('วัตถุประสงค์ของโครงการนี้ คือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('1)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(' สร้างโอกาสที่เสมอภาคให้ผู้เรียนที่มีความต้องการพิเศษได้รับการศึกษาที่มีคุณภาพระดับสูงกว่ามัธยมศึกษาตอนปลาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.28 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(' หรือระดับประกาศนียบัตรวิชาชีพ (ปวช.) ตลอดจนส่งเสริมให้ผู้เรียนสามารถมีงานทำหลังสำเร็จการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.18 });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('2)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(' ยกระดับคุณภาพสถานศึกษาในการพัฒนาผู้เรียนที่มีความต้องการพิเศษในสายอาชีพชั้นสูงให้ตอบสนองต่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.8 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(' ความต้องการการจ้างงานของสถานประกอบการ หรือ สามารถประกอบอาชีพที่ตนเองถนัด เกิดการพึ่งพาตนเอง', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.55 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('3)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(' ปรับหลักสูตรและการจัดการเรียนการสอนให้กับผู้เรียนที่มีความต้องการพิเศษในสถานศึกษาอาชีวศึกษา หรือ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.62 });

        s = { "x": 25, "y": s['y'] + s['h'], "w": 3, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text(' ระบบทวิภาคีในรูปแบบต่าง ๆ ให้ตอบสนองต่อความต้องการตามแผนยุทธศาสตร์ประเทศไทย 4.0', cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.55 });

        for await (const p of Problem) {
            s = { "x": 25, "y": voc(doc.y), "w": 3, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text('-', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 162, "h": 6.5, "bd": border }
            doc.font(Italic).fillColor("black").text(p.o_objective.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.18 });
        }

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

        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('5.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 166, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("การแสดงข้อมูลการสำรวจจำนวนผู้เรียนที่มีความต้องการพิเศษในเขตพื้นที่ให้บริการของสถานศึกษาที่มีความต้องการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.26 });
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

        s = { "x": 25, "y": s['y'] + s['h'], "w": 166, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ศึกษาต่อในระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) (โปรดแนบเอกสารเพิ่มเติมที่แสดงรายละเอียดที่เกี่ยวข้อง)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 25, "y": s['y'] + s['h'], "w": 35, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สำรวจข้อมูลจากหน่วยงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 93, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_agency.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("วันที่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_day + "/" + Survey.ss_month + "/" + Survey.ss_year, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 25, "y": s['y'] + s['h'], "w": 70, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('พบจำนวนผู้เรียนที่มีความต้องการพิเศษในพื้นที่ ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 43, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_tambon, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("อำเภอ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 43, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 25, "y": s['y'] + s['h'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("จำนวน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_sum_student.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน แบ่งออกตามประเภทความพิการ ได้แก่", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.1 ความพิการทางการเห็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_eyes, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.2 ความพิการทางการได้ยินหรือสื่อความหมาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_ears, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.3 ความพิการทางการเคลื่อนไหวหรือทางร่างกาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_body, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.4 ความพิการทางจิตใจหรือพฤติกรรม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_action, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.5 ความพิการทางสติปัญญา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_brain, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.6 ความพิการทางการเรียนรู้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_learn, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 45, "y": voc(doc.y), "w": 90, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('5.7 ความพิการทางออทิสติก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Survey.ss_autism, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("คน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        // doc.addPage({ layout: 'landscape' })
        // let chkRows = 0

        // for await (let [k, i] of Object.entries(MainMajor)) {

        //     if (chkRows != 0) {
        //         doc.addPage({ layout: 'landscape' })
        //     } else {
        //         // doc.addPage({ layout: 'landscape' })
        //         s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        //         doc.font(Bold).fontSize(14).fillColor("black").text('6.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
        //         doc.font(Bold).fontSize(14).fillColor('black').text("รายละเอียดสาขาวิชา/สาขางานที่สถานศึกษาเสนอ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 166, "h": 6.5, "bd": border }
        //         doc.font(Italic).fontSize(14).fillColor('black').text("สาขาที่ท่านเห็นว่ามีศักยภาพในการจัดการเรียนการสอน ทั้งนี้สามารถเสนอจำนวนหลักสูตรสาขาวิชา/สาขางาน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.55 });

        //         s = { "x": 25, "y": voc(doc.y), "w": 27, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text('ไม่เกิน 3 สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 28, "h": 6.5, "bd": border }
        //         doc.font(Bold).fontSize(14).fillColor('black').text("โปรดระบุหลักสูตรสาขา ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).undash().stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text(" ดังนี้ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        //         s = { "x": 25, "y": voc(doc.y), "w": 100, "h": 5, "bd": border }
        //         doc.font(Bold).fontSize(14).fillColor("black").text('6.' + (coKeys) + ' สาขาวิชาที่ ' + (coKeys), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //     }
        //     let pD2 = [];
        //     for await (let dataI of i.Approve) {

        //         let textRow2 = ""
        //         let textRowSub2 = dataI.ma_budget_comp


        //         let textRow3 = ""

        //         let chkbox1 = "[ ]"
        //         let chkbox2 = "[ ]"
        //         let chkbox3 = "[ ]"
        //         let chkbox4 = "[ ]"
        //         let chkbox5 = "[ ]"
        //         let chkbox6 = "[ ]"
        //         let chkbox7 = "[ ]"
        //         let chkbox8 = "[ ]"



        //         let txtChk1 = "[ ]"
        //         let txtChk2 = "[ ]"
        //         let txtChk3 = "[ ]"
        //         let txtChk4 = "[ ]"

        //         if (dataI.ma_course == "หลักสูตรปกติที่เปิดสอนโดยทั่วไป") {
        //             txtChk1 = "[/]"
        //         } else if (dataI.ma_course == "หลักสูตรที่มีการพัฒนากับสถานประกอบการที่ร่วม") {
        //             txtChk2 = "[/]"
        //             if (dataI.ma_budget == "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน") {
        //                 textRow2 = "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุนจากสถานประกอบการ โปรดระบุรายการที่ได้รับการสนับสนุน" + "\n" + textRowSub2
        //             } else if (dataI.ma_budget == "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ") {
        //                 textRow2 = "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ"
        //             }

        //             textRow3 = "กระบวนการพัฒนาหลักสูตรร่วม"
        //             if (dataI.ma_process1 != '') {
        //                 textRow3 += "\n[/] การทำโครงงาน/งานวิจัยร่วมกัน"
        //             }
        //             if (dataI.ma_process2 != '') {
        //                 textRow3 += "\n[/] ครู อาจารย์ภาคประกอบการเป็นส่วนหนึ่งของการจัดการเรียนการสอน"
        //             }
        //             if (dataI.ma_process3 != '') {
        //                 textRow3 += "\n[/] การฝึกประสบการณ์วิชาชีพในสถานประกอบการที่ร่วมพัฒนาหลักสูตร"
        //             }
        //             if (dataI.ma_process4 != '') {
        //                 textRow3 += "\n[/] การออกแบบรายวิชา กระบวนการเรียนรู้ร่วมกัน"
        //             }
        //             if (dataI.ma_process5 != '') {
        //                 textRow3 += "\n[/] การสนับสนุนอุปกรณ์การเรียน ห้องปฏิบัติการ"
        //             }
        //             if (dataI.ma_process6 != '') {
        //                 textRow3 += "\n[/] การว่าจ้างนักศึกษาที่จบในหลักสูตรในสาขาที่พัฒนาหลักสูตร\nร่วมเข้าทำงานหลังสำเร็จการศึกษา"
        //             }
        //             if (dataI.ma_process7 != '') {
        //                 textRow3 += "\n[/] อื่น ๆ \n   " + dataI.ma_process7_oth
        //             }




        //         } else if (dataI.ma_course == "หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา") {
        //             txtChk3 = "[/]"

        //             textRow3 = "ระบุชื่อสถานประกอบการ"
        //             textRow3 += "\n   " + dataI.ma_course_comp
        //             textRow3 += "\nผลลัพธ์ที่สถานประกอบการคาดหวังจากการทำความร่วมมือ"
        //             textRow3 += "\n   " + dataI.ma_result

        //         } else if (dataI.ma_course == "อื่น ๆ") {
        //             txtChk4 = "[/]"
        //         }


        //         pD2.push(
        //             [
        //                 (coKeys) + ". สาขาวิชา\n" + i.m_major + "\nสาขางาน " + i.m_work + "\nได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร\n" + dataI.ma_confirm + "\n" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป \n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับ\nสถานประกอบการที่ร่วม\n" + txtChk3 + " หลักสูตรที่มีโครงการความร่วมมือผลิต\nบุคลากรให้กับสถานประกอบการที่มีความ\nชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา\n" + txtChk4 + " อื่น ๆ" + "\n" + (dataI.ma_course == "อื่น ๆ" ? dataI.ma_course_other : ""),
        //                 textRow2,
        //                 textRow3,
        //             ]

        //         )
        //         const table2 = {
        //             title: "",
        //             headers: [
        //                 { label: "สาขาวิชา/สาขางาน", headerAlign: "center", align: "left" },
        //                 { label: "งบประมาณ\nและทรัพยากรอื่น ๆ", headerAlign: "center", align: "left" },
        //                 { label: 'รายวิชาที่จัดการเรียนการสอน\nในสถานประกอบการ', headerAlign: "center", align: "left" },
        //             ],
        //             rows: pD2,

        //         };

        //         doc.font(Bold).fontSize(12).fillColor('black');
        //         let xr = 0
        //         await doc.table(table2, {
        //             prepareHeader: (x) => {
        //                 doc.font(Bold).fontSize(12).fillColor('black')
        //             },
        //             prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //                 doc.font(ThS).fontSize(12).fillColor('black')
        //             },
        //             columnsSize: [cov(50), cov(90), cov(100)],
        //             x: cov(20), y: cov(voc(doc.y))
        //         });
        //     }
        //     doc.addPage({
        //         size: 'A4',
        //         layout: `portrait`,
        //         margins: {
        //             top: 50,
        //             bottom: 0,
        //             left: 72,
        //             right: 72,
        //         }
        //     })
        //     s = { "x": 20, "y": 20, "w": 50, "h": 5, "bd": border }
        //     doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        //     s = { "x": 20, "y": s['h'] + s['y'], "w": 37, "h": 5, "bd": border }
        //     doc.font(Bold).fontSize(14).fillColor("black").text((coKeys) + '.ปวส. หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        //     s = { "x": s['x'] + s['w'], "y": s['y'], "w": 133, "h": 6.5, "bd": border }
        //     doc.font(ThS).fontSize(14).fillColor('black').text(i.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //     doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        //     s = { "x": 20, "y": s['h'] + s['y'], "w": 17, "h": 5, "bd": border }
        //     doc.font(Bold).fontSize(14).fillColor("black").text('   สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        //     s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
        //     doc.font(ThS).fontSize(14).fillColor('black').text(i.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //     doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        //     s = { "x": 30, "y": s['h'] + s['y'], "w": 53, "h": 5, "bd": border }
        //     doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขาทั้งหมด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        //     s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        //     doc.font(Bold).fontSize(14).fillColor('black').text(i.teacher.length, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //     doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        //     s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
        //     doc.font(Bold).fontSize(14).fillColor('black').text("คน (ควรมีจำนวนอย่างน้อย 3 คน)  ดังนี้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        //     let coTeacher = 1
        //     for await (const t of i.teacher) {
        //         // console.log(t)
        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 23, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text(coTeacher + ') ชื่อ- นามสกุล ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 138, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_prefix == "อื่น ๆ" ? t.mt_prefix_oth : t.mt_prefix) + t.mt_firstname + " " + t.mt_lastname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 18, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text("วุฒิการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_education == "อื่น ๆ" ? t.mt_education_oth : t.mt_education), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("สถาบันที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_school), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 35, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text("สาขาวิชาที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_major), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 26, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("ปีที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_end), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 38, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text("ตำแหน่งทางวิชาการ/ราชการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_position), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("ระยะเวลาดำรงตำแหน่ง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 43, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text("ระยะเวลาในการเป็นครู/อาจารย์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_year + "ปี " + t.mt_month + "เดือน"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
        //         // doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text("เบอร์โทรศัพท์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_tel), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("อีเมล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        //         s = { "x": s['x'] + s['w'], "y": s['y'], "w": 84, "h": 6.5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text(t.mt_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        //         doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 100, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor("black").text("ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 161, "h": 5, "bd": border }
        //         doc.font(ThS).fontSize(14).fillColor('black').text("   " + t.mt_exp, cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
        //         // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
        //         s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }


        //         coTeacher++
        //     }

        //     chkRows++
        // }



        // doc.addPage({
        //     size: 'A4',
        //     // layout: `portrait`,
        //     layout: `landscape`,
        //     margins: {
        //         top: 50,
        //         bottom: 0,
        //         left: 72,
        //         right: 72,
        //     }
        // })
        // s = { "x": 20, "y": 20, "w": 200, "h": 5, "bd": border }

        // doc.font(Bold).fillColor("black").text('7. ข้อมูลสนับสนุนที่สะท้อนถึงผลการดำเนินงานของสถานศึกษา (การคงอยู่ การออกกลางคัน และการมีงานทำ หรือการศึกษาต่อในระดับที่สูงขึ้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        // let pD3 = [];
        // let majroHead = {};
        // for await (let X of SupReflect) {
        //     majroHead[TypesPee != '1' ? ("สาขาวิชา " + X.m_major + " สาขางาน " + X.m_work) : ("สาขาวิชา " + X.m_major)] = []
        // }
        // for await (let X of SupReflect) {
        //     majroHead[TypesPee != '1' ? ("สาขาวิชา " + X.m_major + " สาขางาน " + X.m_work) : ("สาขาวิชา " + X.m_major)].push([
        //         X.sr_year,
        //         X.sr_freshy,
        //         X.sr_std_continue,
        //         X.sr_std_drop,
        //         X.sr_std_congrat,
        //         X.sr_std_work,
        //         X.sr_std_high,
        //         X.sr_std_together,
        //         X.sr_std_sum_work,
        //     ]
        //     )
        // }


        // const table0 = {
        //     headers: [
        //         { label: "ปีการศึกษา\nที่รับนักศึกษาเข้า", headerAlign: "center", align: "center" },
        //         { label: "นักศึกษาแรกเข้า*\n(คน)", headerAlign: "center", align: "center" },
        //         { label: "นักศึกษาคงอยู่\nสะสม (คน)", headerAlign: "center", align: "center" },
        //         { label: "นักศึกษาที่ออก\nกลางคันสะสม\n(คน)", headerAlign: "center", align: "center" },
        //         { label: "นักศึกษาทุนที่\nสำเร็จการศึกษา\n(คน)", headerAlign: "center", align: "center" },
        //         { label: "ผู้มีงานทำหรือ\nประกอบอาชีพอิสระ\n(คน)", headerAlign: "center", align: "center" },
        //         { label: "ผู้ศึกษาต่อในระดับ\nที่สูงขึ้น (คน)", headerAlign: "center", align: "center" },
        //         { label: "ผู้ที่ทำงานและ\nศึกษาต่อไปพร้อมกัน\n(คน)", headerAlign: "center", align: "center" },
        //         { label: "รายได้เฉลี่ยต่อเดือน\nของผู้มีงานทำหรือ\nประกอบอาชีพอิสระ\n(บาท)", headerAlign: "center", align: "center" },
        //     ],

        // };

        // doc.font(Bold).fontSize(12).fillColor('black');
        // await doc.table(table0, {
        //     prepareHeader: (x) => {
        //         doc.font(Bold).fontSize(12).fillColor('black')
        //     },
        //     prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //     },
        //     columnsSize: [cov(25), cov(25), cov(25), cov(30), cov(30), cov(30), cov(30), cov(30), cov(30)],
        //     x: cov(25), y: cov(30)
        // });
        // for await (let [mKey, mVal] of Object.entries(majroHead)) {
        //     let table1 = {}
        //     let table3 = {}
        //     // console.log("mKey : ", mKey, "mVal : ", mVal[0][1])

        //     table1 = {
        //         title: "",
        //         headers: [
        //             { label: mKey, headerAlign: "left", align: "center", headerColor: "#FFFFFF", headerOpacity: 0 },

        //         ],

        //     };

        //     doc.font(Bold).fontSize(12).fillColor('black');
        //     await doc.table(table1, {
        //         prepareHeader: (x) => {
        //             doc.font(Bold).fontSize(12).fillColor('black')
        //         },
        //         prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //             doc.font(ThS).fontSize(12).fillColor('black')
        //         },
        //         columnsSize: [cov(255)],
        //         x: cov(25), y: doc.y
        //     });

        //     table3 = {
        //         title: "",
        //         headers: [
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //             { label: "", headerAlign: "center", align: "center", headerColor: "#FFFFFF" },
        //         ],

        //         rows: mVal,

        //     };

        //     doc.font(Bold).fontSize(12).fillColor('black');
        //     let xr = 0
        //     await doc.table(table3, {
        //         prepareHeader: (x) => {
        //             doc.font(Bold).fontSize(12).fillColor('black')
        //         },
        //         prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //             doc.font(ThS).fontSize(12).fillColor('black')
        //         },
        //         columnsSize: [cov(25), cov(25), cov(25), cov(30), cov(30), cov(30), cov(30), cov(30), cov(30)],
        //         x: cov(25), y: doc.y - 19
        //     });

        // }



        // s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาออกกลางคัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth2, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        // s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาที่มีงานทำ ประกอบอาชีพอิสระ หรือการศึกษาต่อในระดับที่สูงขึ้น (เช่น การสำรวจโดยใช้แบบสำรวจ ปี 2565) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        // doc.addPage({
        //     size: 'A4',
        //     // layout: `portrait`,
        //     layout: `landscape`,
        //     margins: {
        //         top: 50,
        //         bottom: 0,
        //         left: 72,
        //         right: 72,
        //     }
        // })



        // s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        // doc.font(Bold).fontSize(14).fillColor("black").text('8.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        // doc.font(Bold).fontSize(14).fillColor('black').text("สถานที่ที่จะดำเนินการสอน  ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 200, "h": 6.5, "bd": border }
        // doc.font(Italic).fontSize(14).fillColor('black').text("(แยกรายหลักสูตรสาขาที่ต้องการยื่นเสนอขอ) (ระบุสถานที่จัดการเรียนการสอน สถานศึกษา… ตำบล…อำเภอ…จังหวัด….) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });


        // let rox = 1
        // let pD35 = [];

        // for await (let X of Area) {
        //     pD35.push(
        //         [
        //             rox + ". " + X.m_major.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.m_work.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.tp_place.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.tp_district.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.tp_amphur.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.tp_province.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //         ],
        //     )
        //     rox++
        // }
        // const table3 = {
        //     title: "",
        //     headers: [
        //         { label: TypesPee == "1" ? "ชื่อหลักสูตรสาขาที่เสนอ " : "ชื่อหลักสูตรสาขาวิชา/สาขางานที่เสนอ", headerAlign: "center", align: "left" },
        //         { label: "สาขางาน", headerAlign: "center", align: "left" },
        //         { label: "ชื่อสถานที่จัดการเรียนการสอน", headerAlign: "center", align: "left" },
        //         { label: "ตำบล", headerAlign: "center", align: "left" },
        //         { label: 'อำเภอ', headerAlign: "center", align: "left" },
        //         { label: 'จังหวัด', headerAlign: "center", align: "left" },
        //     ],
        //     rows: pD35,

        // };

        // doc.font(Bold).fontSize(12).fillColor('black');
        // let xr = 0
        // await doc.table(table3, {
        //     prepareHeader: (x) => {
        //         doc.font(Bold).fontSize(12).fillColor('black')
        //     },
        //     prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //         doc.font(ThS).fontSize(12).fillColor('black')
        //     },
        //     columnsSize: [cov(55), cov(50), cov(55), cov(30), cov(30), cov(30)],
        //     x: cov(25), y: cov(35)
        // });

        // doc.addPage({
        //     size: 'A4',
        //     layout: `landscape`,
        //     margins: {
        //         top: 50,
        //         bottom: 0,
        //         left: 72,
        //         right: 72,
        //     }
        // })
        // s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        // doc.font(Bold).fontSize(14).fillColor("black").text('9', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 123, "h": 6.5, "bd": border }
        // doc.font(Bold).fontSize(14).fillColor('black').text(" การบริหารจัดการประเด็นที่จะทำให้สถานศึกษาไม่ประสบความสำเร็จในการดำเนินโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        // s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        // doc.font(Italic).fontSize(14).fillColor('black').text("ระบุประเด็นที่จะเกิดขึ้น ผลกระทบที่คาดว่าจะเกิดขึ้น และวิธีการการบริหารจัดการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        // let pD39 = [];
        // for await (let X of Manage) {
        //     pD39.push(
        //         [
        //             X.mn_issue.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.mn_effect.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //             X.mn_protect.replaceAll("\r\n", "\n").replaceAll("	", "  "),
        //         ],
        //     )
        // }
        // // console.log(pD39)

        // const table39 = {
        //     title: "",
        //     headers: [
        //         { label: "ประเด็นที่ทำให้สถานศึกษาไม่ประสบความสำเร็จใน\nการดำเนินโครงการ", headerAlign: "center", align: "left" },
        //         { label: "ผลกระทบที่คาดว่าจะเกิดขึ้น", headerAlign: "center", align: "left" },
        //         { label: "วิธีการการบริหารจัดการและ\nการป้องกันไม่ให้เกิดความเสี่ยง", headerAlign: "center", align: "left" },
        //     ],
        //     rows: pD39,

        // };

        // doc.font(Bold).fontSize(12).fillColor('black');
        // let xr9 = 0
        // await doc.table(table39, {
        //     prepareHeader: () => {
        //         doc.font(Bold).fontSize(12).fillColor('black')
        //     },
        //     prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //         doc.font(ThS).fontSize(12).fillColor('black')
        //     },
        //     columnsSize: [cov(85), cov(85), cov(85)],
        //     x: cov(20), y: doc.y
        // });



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


export const PDF41 = async (req) => {
    const MainMajor = req['Major']


    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let chkRows = 0
        let chkKey = {
            "1": "xxx",
            "2": "xxx",
            "3": "xxx",
        }
        let coKeys = 1
        let oKey = 1
        for await (let [k, i] of Object.entries(MainMajor)) {
            chkKey[oKey] = k
            oKey++
        }
        if (chkKey[coKeys] != "xxx") {
            const i = MainMajor[chkKey[coKeys]]
            // console.log("chkKey[coKeys]", i.Approve)
            // console.log("chkKey[coKeys]", MainMajor['12'].Approve)
            let s = {};

            const border = 'ffffff';

            let x;
            let y = 0;

            let doc = new PDFDocument({
                size: 'A4',
                layout: `landscape`,
                // layout: `landscape`,
                margins: {
                    top: 50,
                    bottom: 0,
                    left: 72,
                    right: 72,
                }
            });

            // for await (let [k, i] of Object.entries(MainMajor)) {

            if (chkRows != 0) {
                doc.addPage({ layout: 'landscape' })
            } else {
                // doc.addPage({ layout: 'landscape' })
                s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor("black").text('6.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor('black').text("รายละเอียดสาขาวิชา/สาขางานที่สถานศึกษาเสนอ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 166, "h": 6.5, "bd": border }
                doc.font(Italic).fontSize(14).fillColor('black').text("สาขาที่ท่านเห็นว่ามีศักยภาพในการจัดการเรียนการสอน ทั้งนี้สามารถเสนอจำนวนหลักสูตรสาขาวิชา/สาขางาน ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.55 });

                s = { "x": 25, "y": voc(doc.y), "w": 27, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text('ไม่เกิน 3 สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.28 }).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 28, "h": 6.5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor('black').text("โปรดระบุหลักสูตรสาขา ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).undash().stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(" ดังนี้ ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

                s = { "x": 25, "y": voc(doc.y), "w": 100, "h": 5, "bd": border }
                doc.font(Bold).fontSize(14).fillColor("black").text('6.' + (coKeys) + ' สาขาวิชาที่ ' + (coKeys), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            }
            let pD2 = [];
            // console.log("---------", i.Approve)
            for await (let dataI of i.Approve) {
                // console.log("--------- - - - - - -- - -- -- - - - - -- ---------", dataI)

                let textRow2 = ""
                let textRowSub2 = dataI.ma_budget_comp


                let textRow3 = ""

                let chkbox1 = "[ ]"
                let chkbox2 = "[ ]"
                let chkbox3 = "[ ]"
                let chkbox4 = "[ ]"
                let chkbox5 = "[ ]"
                let chkbox6 = "[ ]"
                let chkbox7 = "[ ]"
                let chkbox8 = "[ ]"

                // console.log("---------------------", dataI)


                let txtChk1 = "[ ]"
                let txtChk2 = "[ ]"
                let txtChk3 = "[ ]"
                let txtChk4 = "[ ]"
                // console.log("---------", dataI.ma_budget)
                if (dataI.ma_course == "หลักสูตรปกติที่เปิดสอนโดยทั่วไป") {
                    txtChk1 = "[/]"
                } else if (dataI.ma_course == "หลักสูตรที่มีการพัฒนากับสถานประกอบการที่ร่วม") {
                    txtChk2 = "[/]"
                    if (dataI.ma_budget == "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน") {
                        // console.log("- - - - - - - - -", dataI.ma_budget)
                        textRow2 = "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุนจากสถานประกอบการ โปรดระบุรายการที่ได้รับการสนับสนุน" + "\n" + textRowSub2
                    } else if (dataI.ma_budget == "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ") {
                        textRow2 = "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ"
                    }

                    // console.log("---------------------222222", dataI)

                    textRow3 = "กระบวนการพัฒนาหลักสูตรร่วม"
                    if (dataI.ma_process1 != '') {
                        textRow3 += "\n[/] การทำโครงงาน/งานวิจัยร่วมกัน"
                    }
                    if (dataI.ma_process2 != '') {
                        textRow3 += "\n[/] ครู อาจารย์ภาคประกอบการเป็นส่วนหนึ่งของการจัดการเรียนการสอน"
                    }
                    if (dataI.ma_process3 != '') {
                        textRow3 += "\n[/] การฝึกประสบการณ์วิชาชีพในสถานประกอบการที่ร่วมพัฒนาหลักสูตร"
                    }
                    if (dataI.ma_process4 != '') {
                        textRow3 += "\n[/] การออกแบบรายวิชา กระบวนการเรียนรู้ร่วมกัน"
                    }
                    if (dataI.ma_process5 != '') {
                        textRow3 += "\n[/] การสนับสนุนอุปกรณ์การเรียน ห้องปฏิบัติการ"
                    }
                    if (dataI.ma_process6 != '') {
                        textRow3 += "\n[/] การว่าจ้างนักศึกษาที่จบในหลักสูตรในสาขาที่พัฒนาหลักสูตร\nร่วมเข้าทำงานหลังสำเร็จการศึกษา"
                    }
                    if (dataI.ma_process7 != '') {
                        textRow3 += "\n[/] อื่น ๆ \n   " + dataI.ma_process7_oth
                    }

                } else if (dataI.ma_course == "หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา") {
                    txtChk3 = "[/]"

                    textRow3 = "ระบุชื่อสถานประกอบการ"
                    textRow3 += "\n   " + dataI.ma_course_comp
                    textRow3 += "\nผลลัพธ์ที่สถานประกอบการคาดหวังจากการทำความร่วมมือ"
                    textRow3 += "\n   " + dataI.ma_result

                } else if (dataI.ma_course == "อื่น ๆ") {
                    txtChk4 = "[/]"
                }


                pD2.push(
                    [
                        (coKeys) + ". สาขาวิชา\n" + i.m_major + "\nสาขางาน " + i.m_work + "\nได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร\n" + dataI.ma_confirm + "\n" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป \n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับ\nสถานประกอบการที่ร่วม\n" + txtChk3 + " หลักสูตรที่มีโครงการความร่วมมือผลิต\nบุคลากรให้กับสถานประกอบการที่มีความ\nชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา\n" + txtChk4 + " อื่น ๆ" + "\n" + (dataI.ma_course == "อื่น ๆ" ? dataI.ma_course_other : ""),
                        textRow2,
                        textRow3,
                    ]

                )
                const table2 = {
                    title: "",
                    headers: [
                        { label: "สาขาวิชา/สาขางาน", headerAlign: "center", align: "left" },
                        { label: "งบประมาณ\nและทรัพยากรอื่น ๆ", headerAlign: "center", align: "left" },
                        { label: 'รายวิชาที่จัดการเรียนการสอน\nในสถานประกอบการ', headerAlign: "center", align: "left" },
                    ],
                    rows: pD2,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table2, {

                    columnSpacing: 2,
                    padding: 2,
                    prepareHeader: (x) => {
                        doc.font(Bold).fontSize(12).fillColor('black')
                    },
                    prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font(ThS).fontSize(12).fillColor('black')
                        if (indexColumn === 0) {
                            doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                        }
                        doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                    },
                    columnsSize: [cov(50), cov(90), cov(100)],
                    x: cov(20), y: cov(voc(doc.y))
                });
            }
            doc.addPage({
                size: 'A4',
                layout: `portrait`,
                margins: {
                    top: 50,
                    bottom: 0,
                    left: 72,
                    right: 72,
                }
            })
            s = { "x": 20, "y": 20, "w": 50, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": 20, "y": s['h'] + s['y'], "w": 37, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(coKeys + '.ปวส. หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 133, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 20, "y": s['h'] + s['y'], "w": 17, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('   สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 30, "y": s['h'] + s['y'], "w": 53, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขาทั้งหมด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text(i.teacher.length, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("คน (ควรมีจำนวนอย่างน้อย 3 คน)  ดังนี้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            let coTeacher = 1
            for await (const t of i.teacher) {
                if (doc.y > 600) {
                    doc.addPage({
                        size: 'A4',
                        layout: `portrait`,
                        margins: {
                            top: 50,
                            bottom: 0,
                            left: 72,
                            right: 72,
                        }
                    })

                    s = { "x": 30, "y": 20, "w": 23, "h": 5, "bd": border }
                }
                // console.log(t)
                s = { "x": 30, "y": voc(doc.y), "w": 23, "h": 5, "bd": border }
                s = { "x": 30, "y": s['h'] + s['y'], "w": 23, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(coTeacher + ') ชื่อ- นามสกุล ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 138, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_prefix == "อื่น ๆ" ? t.mt_prefix_oth : t.mt_prefix) + t.mt_firstname + " " + t.mt_lastname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 30, "y": s['h'] + s['y'], "w": 18, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("วุฒิการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_education == "อื่น ๆ" ? t.mt_education_oth : t.mt_education), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("สถาบันที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_school), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 30, "y": s['h'] + s['y'], "w": 35, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("สาขาวิชาที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_major), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 26, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ปีที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_end), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


                s = { "x": 30, "y": s['h'] + s['y'], "w": 38, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ตำแหน่งทางวิชาการ/ราชการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_position), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ระยะเวลาดำรงตำแหน่ง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


                s = { "x": 30, "y": s['h'] + s['y'], "w": 43, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ระยะเวลาในการเป็นครู/อาจารย์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_year + "ปี " + t.mt_month + "เดือน"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                // doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


                s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("เบอร์โทรศัพท์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_tel), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("อีเมล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 84, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(t.mt_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": 30, "y": s['h'] + s['y'], "w": 100, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": 30, "y": s['h'] + s['y'], "w": 161, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("   " + t.mt_exp.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
                s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }


                coTeacher++
            }

            // chkRows++
            // }



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
            // console.log("xxxxxxxxxxxxx")
            return base64
        } else {
            // console.log("cccccccccccc")
            return null
        }

    } catch (error) {
        console.log(error)
        // console.log("dddddddddddddd")
        return null
    }
};

export const PDF42 = async (req) => {
    const MainMajor = req['Major']


    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let chkRows = 0
        let chkKey = {
            "1": "xxx",
            "2": "xxx",
            "3": "xxx",
        }
        let coKeys = 2
        let oKey = 1
        for await (let [k, i] of Object.entries(MainMajor)) {
            chkKey[oKey] = k
            oKey++
        }
        if (chkKey[coKeys] != "xxx") {
            const i = MainMajor[chkKey[coKeys]]
            let s = {};

            const border = 'ffffff';

            let x;
            let y = 0;

            let doc = new PDFDocument({
                size: 'A4',
                layout: `landscape`,
                // layout: `landscape`,
                margins: {
                    top: 50,
                    bottom: 0,
                    left: 72,
                    right: 72,
                }
            });

            // for await (let [k, i] of Object.entries(MainMajor)) {


            s = { "x": 25, "y": voc(doc.y), "w": 100, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('6.' + (coKeys) + ' สาขาวิชาที่ ' + (coKeys), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            let pD2 = [];
            for await (let dataI of i.Approve) {

                let textRow2 = ""
                let textRowSub2 = dataI.ma_budget_comp


                let textRow3 = ""

                let chkbox1 = "[ ]"
                let chkbox2 = "[ ]"
                let chkbox3 = "[ ]"
                let chkbox4 = "[ ]"
                let chkbox5 = "[ ]"
                let chkbox6 = "[ ]"
                let chkbox7 = "[ ]"
                let chkbox8 = "[ ]"



                let txtChk1 = "[ ]"
                let txtChk2 = "[ ]"
                let txtChk3 = "[ ]"
                let txtChk4 = "[ ]"

                if (dataI.ma_course == "หลักสูตรปกติที่เปิดสอนโดยทั่วไป") {
                    txtChk1 = "[/]"
                } else if (dataI.ma_course == "หลักสูตรที่มีการพัฒนากับสถานประกอบการที่ร่วม") {
                    txtChk2 = "[/]"
                    if (dataI.ma_budget == "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน") {
                        textRow2 = "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุนจากสถานประกอบการ โปรดระบุรายการที่ได้รับการสนับสนุน" + "\n" + textRowSub2
                    } else if (dataI.ma_budget == "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ") {
                        textRow2 = "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ"
                    }

                    textRow3 = "กระบวนการพัฒนาหลักสูตรร่วม"
                    if (dataI.ma_process1 != '') {
                        textRow3 += "\n[/] การทำโครงงาน/งานวิจัยร่วมกัน"
                    }
                    if (dataI.ma_process2 != '') {
                        textRow3 += "\n[/] ครู อาจารย์ภาคประกอบการเป็นส่วนหนึ่งของการจัดการเรียนการสอน"
                    }
                    if (dataI.ma_process3 != '') {
                        textRow3 += "\n[/] การฝึกประสบการณ์วิชาชีพในสถานประกอบการที่ร่วมพัฒนาหลักสูตร"
                    }
                    if (dataI.ma_process4 != '') {
                        textRow3 += "\n[/] การออกแบบรายวิชา กระบวนการเรียนรู้ร่วมกัน"
                    }
                    if (dataI.ma_process5 != '') {
                        textRow3 += "\n[/] การสนับสนุนอุปกรณ์การเรียน ห้องปฏิบัติการ"
                    }
                    if (dataI.ma_process6 != '') {
                        textRow3 += "\n[/] การว่าจ้างนักศึกษาที่จบในหลักสูตรในสาขาที่พัฒนาหลักสูตร\nร่วมเข้าทำงานหลังสำเร็จการศึกษา"
                    }
                    if (dataI.ma_process7 != '') {
                        textRow3 += "\n[/] อื่น ๆ \n   " + dataI.ma_process7_oth
                    }




                } else if (dataI.ma_course == "หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา") {
                    txtChk3 = "[/]"

                    textRow3 = "ระบุชื่อสถานประกอบการ"
                    textRow3 += "\n   " + dataI.ma_course_comp
                    textRow3 += "\nผลลัพธ์ที่สถานประกอบการคาดหวังจากการทำความร่วมมือ"
                    textRow3 += "\n   " + dataI.ma_result

                } else if (dataI.ma_course == "อื่น ๆ") {
                    txtChk4 = "[/]"
                }


                pD2.push(
                    [
                        coKeys + ". สาขาวิชา\n" + i.m_major + "\nสาขางาน " + i.m_work + "\nได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร\n" + dataI.ma_confirm + "\n" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป \n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับ\nสถานประกอบการที่ร่วม\n" + txtChk3 + " หลักสูตรที่มีโครงการความร่วมมือผลิต\nบุคลากรให้กับสถานประกอบการที่มีความ\nชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา\n" + txtChk4 + " อื่น ๆ" + "\n" + (dataI.ma_course == "อื่น ๆ" ? dataI.ma_course_other : ""),
                        textRow2,
                        textRow3,
                    ]

                )
                const table2 = {
                    title: "",
                    headers: [
                        { label: "สาขาวิชา/สาขางาน", headerAlign: "center", align: "left" },
                        { label: "งบประมาณ\nและทรัพยากรอื่น ๆ", headerAlign: "center", align: "left" },
                        { label: 'รายวิชาที่จัดการเรียนการสอน\nในสถานประกอบการ', headerAlign: "center", align: "left" },
                    ],
                    rows: pD2,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table2, {

                    columnSpacing: 2,
                    padding: 2,
                    prepareHeader: (x) => {
                        doc.font(Bold).fontSize(12).fillColor('black')
                    },
                    prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                        if (indexColumn === 0) {
                            doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                        }
                        doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                        doc.font(ThS).fontSize(12).fillColor('black')
                    },
                    columnsSize: [cov(50), cov(90), cov(100)],
                    x: cov(20), y: cov(voc(doc.y))
                });
            }
            doc.addPage({
                size: 'A4',
                layout: `portrait`,
                margins: {
                    top: 50,
                    bottom: 0,
                    left: 72,
                    right: 72,
                }
            })
            s = { "x": 20, "y": 20, "w": 50, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": 20, "y": s['h'] + s['y'], "w": 37, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(coKeys + '.ปวส. หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 133, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 20, "y": s['h'] + s['y'], "w": 17, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('   สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 30, "y": s['h'] + s['y'], "w": 53, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขาทั้งหมด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text(i.teacher.length, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("คน (ควรมีจำนวนอย่างน้อย 3 คน)  ดังนี้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            let coTeacher = 1
            for await (const t of i.teacher) {
                if (doc.y > 600) {
                    doc.addPage({
                        size: 'A4',
                        layout: `portrait`,
                        margins: {
                            top: 50,
                            bottom: 0,
                            left: 72,
                            right: 72,
                        }
                    })

                    s = { "x": 30, "y": 20, "w": 23, "h": 5, "bd": border }
                }
                // console.log(t)
                s = { "x": 30, "y": voc(doc.y), "w": 23, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(coTeacher + ') ชื่อ- นามสกุล ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 138, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_prefix == "อื่น ๆ" ? t.mt_prefix_oth : t.mt_prefix) + t.mt_firstname + " " + t.mt_lastname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 30, "y": s['h'] + s['y'], "w": 18, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("วุฒิการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_education == "อื่น ๆ" ? t.mt_education_oth : t.mt_education), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("สถาบันที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_school), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 30, "y": s['h'] + s['y'], "w": 35, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("สาขาวิชาที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_major), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 26, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ปีที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_end), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


                s = { "x": 30, "y": s['h'] + s['y'], "w": 38, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ตำแหน่งทางวิชาการ/ราชการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_position), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ระยะเวลาดำรงตำแหน่ง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


                s = { "x": 30, "y": s['h'] + s['y'], "w": 43, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ระยะเวลาในการเป็นครู/อาจารย์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_year + "ปี " + t.mt_month + "เดือน"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                // doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


                s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("เบอร์โทรศัพท์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_tel), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("อีเมล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 84, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(t.mt_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": 30, "y": s['h'] + s['y'], "w": 100, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": 30, "y": s['h'] + s['y'], "w": 161, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("   " + t.mt_exp.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
                s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }


                coTeacher++
            }

            // chkRows++
            // }



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
            return null
        }

    } catch (error) {
        console.log(error)
        return null
    }
};

export const PDF43 = async (req) => {
    const MainMajor = req['Major']


    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let chkRows = 0
        let chkKey = {
            "1": "xxx",
            "2": "xxx",
            "3": "xxx",
        }
        let coKeys = 3
        let oKey = 1
        for await (let [k, i] of Object.entries(MainMajor)) {
            chkKey[oKey] = k
            oKey++
        }
        if (chkKey[coKeys] != "xxx") {
            const i = MainMajor[chkKey[coKeys]]
            let s = {};

            const border = 'ffffff';

            let x;
            let y = 0;

            let doc = new PDFDocument({
                size: 'A4',
                layout: `landscape`,
                // layout: `landscape`,
                margins: {
                    top: 50,
                    bottom: 0,
                    left: 72,
                    right: 72,
                }
            });

            s = { "x": 25, "y": voc(doc.y), "w": 100, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('6.' + (coKeys) + ' สาขาวิชาที่ ' + (coKeys), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            let pD2 = [];
            for await (let dataI of i.Approve) {

                let textRow2 = ""
                let textRowSub2 = dataI.ma_budget_comp


                let textRow3 = ""

                let chkbox1 = "[ ]"
                let chkbox2 = "[ ]"
                let chkbox3 = "[ ]"
                let chkbox4 = "[ ]"
                let chkbox5 = "[ ]"
                let chkbox6 = "[ ]"
                let chkbox7 = "[ ]"
                let chkbox8 = "[ ]"



                let txtChk1 = "[ ]"
                let txtChk2 = "[ ]"
                let txtChk3 = "[ ]"
                let txtChk4 = "[ ]"

                if (dataI.ma_course == "หลักสูตรปกติที่เปิดสอนโดยทั่วไป") {
                    txtChk1 = "[/]"
                } else if (dataI.ma_course == "หลักสูตรที่มีการพัฒนากับสถานประกอบการที่ร่วม") {
                    txtChk2 = "[/]"
                    if (dataI.ma_budget == "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุน") {
                        textRow2 = "ได้รับงบประมาณ หรือทรัพยากรอื่น ๆ สนับสนุนจากสถานประกอบการ โปรดระบุรายการที่ได้รับการสนับสนุน" + "\n" + textRowSub2
                    } else if (dataI.ma_budget == "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ") {
                        textRow2 = "ไม่ได้รับงบประมาณสนับสนุนจากสถานประกอบการ"
                    }

                    textRow3 = "กระบวนการพัฒนาหลักสูตรร่วม"
                    if (dataI.ma_process1 != '') {
                        textRow3 += "\n[/] การทำโครงงาน/งานวิจัยร่วมกัน"
                    }
                    if (dataI.ma_process2 != '') {
                        textRow3 += "\n[/] ครู อาจารย์ภาคประกอบการเป็นส่วนหนึ่งของการจัดการเรียนการสอน"
                    }
                    if (dataI.ma_process3 != '') {
                        textRow3 += "\n[/] การฝึกประสบการณ์วิชาชีพในสถานประกอบการที่ร่วมพัฒนาหลักสูตร"
                    }
                    if (dataI.ma_process4 != '') {
                        textRow3 += "\n[/] การออกแบบรายวิชา กระบวนการเรียนรู้ร่วมกัน"
                    }
                    if (dataI.ma_process5 != '') {
                        textRow3 += "\n[/] การสนับสนุนอุปกรณ์การเรียน ห้องปฏิบัติการ"
                    }
                    if (dataI.ma_process6 != '') {
                        textRow3 += "\n[/] การว่าจ้างนักศึกษาที่จบในหลักสูตรในสาขาที่พัฒนาหลักสูตร\nร่วมเข้าทำงานหลังสำเร็จการศึกษา"
                    }
                    if (dataI.ma_process7 != '') {
                        textRow3 += "\n[/] อื่น ๆ \n   " + dataI.ma_process7_oth
                    }




                } else if (dataI.ma_course == "หลักสูตรที่มีโครงการความร่วมมือผลิตบุคลากรให้กับสถานประกอบการที่มีความชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา") {
                    txtChk3 = "[/]"

                    textRow3 = "ระบุชื่อสถานประกอบการ"
                    textRow3 += "\n   " + dataI.ma_course_comp
                    textRow3 += "\nผลลัพธ์ที่สถานประกอบการคาดหวังจากการทำความร่วมมือ"
                    textRow3 += "\n   " + dataI.ma_result

                } else if (dataI.ma_course == "อื่น ๆ") {
                    txtChk4 = "[/]"
                }


                pD2.push(
                    [
                        (coKeys) + ". สาขาวิชา\n" + i.m_major + "\nสาขางาน " + i.m_work + "\nได้รับการอนุมัติให้เปิดสอนในปี " + dataI.ma_confirm_year + "\nหน่วยงานที่อนุมัติหลักสูตร\n" + dataI.ma_confirm + "\n" + txtChk1 + " หลักสูตรปกติที่เปิดสอนโดยทั่วไป \n" + txtChk2 + " หลักสูตรที่มีการพัฒนากับ\nสถานประกอบการที่ร่วม\n" + txtChk3 + " หลักสูตรที่มีโครงการความร่วมมือผลิต\nบุคลากรให้กับสถานประกอบการที่มีความ\nชัดเจนและรับประกันการมีงานทำของผู้รับทุนหลังจบการศึกษา\n" + txtChk4 + " อื่น ๆ" + "\n" + (dataI.ma_course == "อื่น ๆ" ? dataI.ma_course_other : ""),
                        textRow2,
                        textRow3,
                    ]

                )
                const table2 = {
                    title: "",
                    headers: [
                        { label: "สาขาวิชา/สาขางาน", headerAlign: "center", align: "left" },
                        { label: "งบประมาณ\nและทรัพยากรอื่น ๆ", headerAlign: "center", align: "left" },
                        { label: 'รายวิชาที่จัดการเรียนการสอน\nในสถานประกอบการ', headerAlign: "center", align: "left" },
                    ],
                    rows: pD2,

                };

                doc.font(Bold).fontSize(12).fillColor('black');
                let xr = 0
                await doc.table(table2, {

                    columnSpacing: 2,
                    padding: 2,
                    prepareHeader: (x) => {
                        doc.font(Bold).fontSize(12).fillColor('black')
                    },
                    prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                        if (indexColumn === 0) {
                            doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                        }
                        doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                        doc.font(ThS).fontSize(12).fillColor('black')
                    },
                    columnsSize: [cov(50), cov(90), cov(100)],
                    x: cov(20), y: cov(voc(doc.y))
                });
            }
            doc.addPage({
                size: 'A4',
                layout: `portrait`,
                margins: {
                    top: 50,
                    bottom: 0,
                    left: 72,
                    right: 72,
                }
            })
            s = { "x": 20, "y": 20, "w": 50, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

            s = { "x": 20, "y": s['h'] + s['y'], "w": 37, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(coKeys + '.ปวส. หลักสูตรสาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 133, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 20, "y": s['h'] + s['y'], "w": 17, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('   สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


            s = { "x": 30, "y": s['h'] + s['y'], "w": 53, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('จำนวนครู/อาจารย์ประจำสาขาทั้งหมด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text(i.teacher.length, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 153, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("คน (ควรมีจำนวนอย่างน้อย 3 คน)  ดังนี้", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

            let coTeacher = 1
            for await (const t of i.teacher) {
                if (doc.y > 600) {
                    doc.addPage({
                        size: 'A4',
                        layout: `portrait`,
                        margins: {
                            top: 50,
                            bottom: 0,
                            left: 72,
                            right: 72,
                        }
                    })

                    s = { "x": 30, "y": 20, "w": 23, "h": 5, "bd": border }
                }
                // console.log(t)
                s = { "x": 30, "y": voc(doc.y), "w": 23, "h": 5, "bd": border }
                s = { "x": 30, "y": s['h'] + s['y'], "w": 23, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text(coTeacher + ') ชื่อ- นามสกุล ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 138, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_prefix == "อื่น ๆ" ? t.mt_prefix_oth : t.mt_prefix) + t.mt_firstname + " " + t.mt_lastname, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 30, "y": s['h'] + s['y'], "w": 18, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("วุฒิการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_education == "อื่น ๆ" ? t.mt_education_oth : t.mt_education), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("สถาบันที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_school), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

                s = { "x": 30, "y": s['h'] + s['y'], "w": 35, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("สาขาวิชาที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_major), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 26, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ปีที่สำเร็จการศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_end), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


                s = { "x": 30, "y": s['h'] + s['y'], "w": 38, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ตำแหน่งทางวิชาการ/ราชการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_position), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ระยะเวลาดำรงตำแหน่ง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


                s = { "x": 30, "y": s['h'] + s['y'], "w": 43, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ระยะเวลาในการเป็นครู/อาจารย์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_year + "ปี " + t.mt_month + "เดือน"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6.5, "bd": border }
                // doc.font(ThS).fontSize(14).fillColor('black').text("ปี", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


                s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("เบอร์โทรศัพท์", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text((t.mt_tel), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("อีเมล", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 84, "h": 6.5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text(t.mt_email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
                s = { "x": 30, "y": s['h'] + s['y'], "w": 100, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor("black").text("ประสบการณ์ทำงาน/ผลงานวิชาการ/การฝึกอบรมที่ตรงตามสาขา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": 30, "y": s['h'] + s['y'], "w": 161, "h": 5, "bd": border }
                doc.font(ThS).fontSize(14).fillColor('black').text("   " + t.mt_exp.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0 });
                // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
                s = { "x": 30, "y": s['h'] + s['y'], "w": 19, "h": 5, "bd": border }


                coTeacher++
            }

            // chkRows++
            // }



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
            return null
        }

    } catch (error) {
        console.log(error)
        return null
    }
};


export const PDF4last = async (req) => {
    const TypesPee = req['TypesPee']
    const Manage = req['Manage']
    const Problem = req['Problem']
    const MainMajor = req['Major']
    const Area = req['Area']
    const Survey = req['Survey'][0]
    // console.log("Survey : ", Survey)


    const SupReflect = req['SupReflect'] == null ? "" : req['SupReflect']
    const SupReflectOth = req['SupReflectOth'] == null ? "" : req['SupReflectOth'][0].sro_data
    const SupReflectOth2 = req['SupReflectOth'] == null ? "" : req['SupReflectOth'][0].sro_ref


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
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });


        s = { "x": 20, "y": 20, "w": 200, "h": 5, "bd": border }

        doc.font(Bold).fillColor("black").text('7. ข้อมูลสนับสนุนที่สะท้อนถึงผลการดำเนินงานของสถานศึกษา (การคงอยู่ การออกกลางคัน และการมีงานทำ หรือการศึกษาต่อในระดับที่สูงขึ้น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

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

            columnSpacing: 2,
            padding: 2,
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

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

                columnSpacing: 2,
                padding: 2,
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    if (indexColumn === 0) {
                        doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                    }
                    doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

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

                columnSpacing: 2,
                padding: 2,
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    if (indexColumn === 0) {
                        doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                    }
                    doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(25), cov(25), cov(25), cov(30), cov(30), cov(30), cov(30), cov(30), cov(30)],
                x: cov(25), y: doc.y - 19
            });

        }



        // s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาที่มีงานทำ ประกอบอาชีพอิสระ หรือการศึกษาต่อในระดับที่สูงขึ้น (เช่น การสำรวจโดยใช้แบบสำรวจ ปี 2565) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        // s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        // doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาออกกลางคัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth2.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        s = { "x": 20, "y": voc(doc.y + 20), "w": 220, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ระบุที่มาของข้อมูลนักศึกษาที่มีงานทำ ประกอบอาชีพอิสระ หรือการศึกษาต่อในระดับที่สูงขึ้น (เช่น การสำรวจโดยใช้แบบสำรวจ ปี 2565) ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 220, "h": 5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("          " + SupReflectOth.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



        doc.addPage({
            size: 'A4',
            // layout: `portrait`,
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })



        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('8.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานที่ที่จะดำเนินการสอน  ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 200, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(แยกรายหลักสูตรสาขาที่ต้องการยื่นเสนอขอ) (ระบุสถานที่จัดการเรียนการสอน สถานศึกษา… ตำบล…อำเภอ…จังหวัด….) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });


        let rox = 1
        let pD35 = [];

        for await (let X of Area) {
            pD35.push(
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
            rows: pD35,

        };

        doc.font(Bold).fontSize(12).fillColor('black');
        let xr = 0
        await doc.table(table3, {

            columnSpacing: 2,
            padding: 2,
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(55), cov(50), cov(55), cov(30), cov(30), cov(30)],
            x: cov(25), y: cov(35)
        });

        doc.addPage({
            size: 'A4',
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })
        s = { "x": 20, "y": 20, "w": 5, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('9', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 123, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text(" การบริหารจัดการประเด็นที่จะทำให้สถานศึกษาไม่ประสบความสำเร็จในการดำเนินโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("ระบุประเด็นที่จะเกิดขึ้น ผลกระทบที่คาดว่าจะเกิดขึ้น และวิธีการการบริหารจัดการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        let pD39 = [];
        for await (let X of Manage) {
            pD39.push(
                [
                    X.mn_issue.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.mn_effect.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                    X.mn_protect.replaceAll("\r\n", "\n").replaceAll("	", "  "),
                ],
            )
        }
        // console.log(pD39)

        const table39 = {
            title: "",
            headers: [
                { label: "ประเด็นที่ทำให้สถานศึกษาไม่ประสบความสำเร็จใน\nการดำเนินโครงการ\n(โปรดระบุ สิ่งที่เกิดขึ้นจริง ในสถานศึกษาของท่าน)", headerAlign: "center", align: "left" },
                { label: "ผลกระทบที่เกิดขึ้น", headerAlign: "center", align: "left" },
                { label: "วิธีการการบริหารจัดการและ\nการป้องกันไม่ให้เกิดความเสี่ยง", headerAlign: "center", align: "left" },
            ],
            rows: pD39,

        };

        doc.font(Bold).fontSize(12).fillColor('black');
        let xr9 = 0
        await doc.table(table39, {
            prepareHeader: () => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(85), cov(85), cov(85)],
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


export const PDF5 = async (req) => {

    const Guide = req['Guide']

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

        s = { "x": 20, "y": 20, "w": 7, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('10.2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 250, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text("สถานศึกษามีแนวทางในการแนะแนวและประชาสัมพันธ์ทุนการศึกษา การค้นหา กระบวนการคัดกรอง และคัดเลือกนักเรียน นักศึกษา ที่มีคุณสมบัติตามที่กำหนดอย่างไร และมีแนวทาง", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.12 });
        s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ในการสร้างความรู้ ความเข้าใจเชิงรุกเกี่ยวกับการศึกษาต่อในระดับอาชีวศึกษา และสร้างแรงบันดาลใจในการเข้าศึกษาตามหลักสูตรที่เปิดการเรียนการสอนให้กับสถานศึกษาที่มีผู้เรียน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
        doc.moveTo(cov(s['x'] + 43), cov(s['y'] + s['h'] - 0.5)).lineTo(cov(79), cov(s['y'] + s['h'] - 0.5)).stroke()


        s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ที่มีความต้องการพิเศษเรียนรวม สถานศึกษาเฉพาะความพิการ หรือ ปวช. หรือเทียบเท่าในเขตพื้นที่ที่สถานศึกษาตั้งอยู่ ให้ครอบคลุมและทั่วถึงได้อย่างไร (เป้าหมายการสร้างโอกาส', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });
        s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('ทางการศึกษา และสร้างแรงบันดาลใจในการเรียนสายอาชีพระดับสูง) ในกรณีที่สถานศึกษาของท่านเคยรับทุน กสศ. โปรดอธิบายแนว ทางการดำเนินงานที่แตกต่างจากเดิม ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.4309 });
        s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor("black").text('หรือจะนำประสบการณ์เดิมมาต่อยอดอย่างไร โปรดอธิบาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 150, "h": 6.5, "bd": border }
        // doc.font(Italic).fontSize(14).fillColor('black').text("(แยกรายหลักสูตรสาขาที่ต้องการยื่นเสนอขอ) (ระบุสถานที่จัดการเรียนการสอน สถานศึกษา… ตำบล…อำเภอ…จังหวัด….) ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.5 });
        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


        let rox = 1
        let pD3 = [];

        for await (let X of Guide) {
            if (rox != 1) {
                doc.addPage({
                    size: 'A4',
                    // layout: `portrait`,
                    layout: `landscape`,
                    margins: {
                        top: 50,
                        bottom: 0,
                        left: 72,
                        right: 72,
                    }
                })
            }
            s = { "x": 27, "y": voc(doc.y) + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('ประเด็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
            s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('     ' + X.g_issue.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.14 });

            s = { "x": 27, "y": voc(doc.y) + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('กระบวนการ/วิธีการ/แนวทางการดำเนินงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
            s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('     ' + X.g_process.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.14 });

            s = { "x": 27, "y": voc(doc.y) + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('เครื่องมือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
            s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('     ' + X.g_tool.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.14 });

            s = { "x": 27, "y": voc(doc.y) + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('เครือข่ายความร่วมมือ*(เช่น หน่วยงานภาครัฐ เอกชน ท้องถิ่น)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
            s = { "x": 27, "y": s['y'] + s['h'], "w": 250, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('     ' + X.g_network.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.14 });

            rox++
            // pD3.push(
            //     [
            //         X.g_issue.replaceAll("\r\n", "\n"),
            //         X.g_process.replaceAll("\r\n", "\n"),
            //         X.g_tool.replaceAll("\r\n", "\n"),
            //         X.g_network.replaceAll("\r\n", "\n"),
            //     ],
            // )
            // rox++
        }

        // const table3 = {
        //     title: "",
        //     headers: [
        //         { label: "ประเด็น", headerAlign: "center", align: "left" },
        //         { label: "กระบวนการ/วิธีการ/แนวทางการดำเนินงาน", headerAlign: "center", align: "left" },
        //         { label: "เครื่องมือ", headerAlign: "center", align: "left" },
        //         { label: "เครือข่ายความร่วมมือ*\n(เช่น หน่วยงานภาครัฐ เอกชน ท้องถิ่น)", headerAlign: "center", align: "left" },
        //     ],
        //     rows: pD3,

        // };



        // doc.font(Bold).fontSize(12).fillColor('black');
        // let xr = 0
        // await doc.table(table3, {
        //     prepareHeader: (x) => {
        //         doc.font(Bold).fontSize(12).fillColor('black')
        //     },
        //     prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
        //         doc.font(ThS).fontSize(12).fillColor('black')
        //         console.log(indexRow, "-------", rectRow)
        //     },
        //     columnsSize: [cov(63), cov(63), cov(63), cov(63)],
        //     x: cov(25), y: cov(voc(doc.y))
        // });

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
            layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        // console.log(Dorm)

        let arrDorm = ["( )", "( )", "( )"]

        if (Dorm.dc_data == "มี เพียงพอกับจำนวนนักศึกษาทุน") {
            arrDorm = ["(/)", "( )", "( )"]
        } else if (Dorm.dc_data == "มี แต่ไม่เพียงพอกับจำนวนนักศึกษาทุน") {
            arrDorm = ["( )", "(/)", "( )"]
        } else if (Dorm.dc_data == "ไม่มี") {
            arrDorm = ["( )", "( )", "(/)"]
        }

        s = { "x": 20, "y": 20, "w": 240, "h": 6.5, "bd": border }
        doc.font(Bold).fillColor("black").text('10.4 สถานศึกษามีแนวทางในการพัฒนาระบบดูแลความเป็นอยู่และสวัสดิภาพของผู้เรียนที่มีความต้องการพิเศษให้สามารถเรียนจบตามกำหนดเวลาอย่างไร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 255, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('สถานศึกษาต้องเสนอแนวทางและกลไกในการติดตามดูแลความเป็นอยู่และสวัสดิภาพเป็น เฉพาะบุคคล ให้คำปรึกษาแก่ผู้รับทุน และการทำงานกับผู้ปกครองอย่างใกล้ชิดตลอดระยะเวลาของ การศึกษา แสดงวิธีการที่จะส่งเสริม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.12 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 255, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('และพัฒนาคุณภาพชีวิตและการเรียนรู้ของผู้รับทุนอย่างมี ประสิทธิภาพ อาทิ การเตรียมความพร้อมและสนับสนุนช่วยเหลือด้านทักษะการทำงาน ทักษะทาง วิชาการ ทักษะการบริหารการเงินส่วนบุคคล และทักษะทางสังคม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.18 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 255, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ให้แก่ผู้รับทุน การจัดเตรียมหอพัก และระบบดูแลที่ดีและเอื้อต่อการเรียนรู้ โดยคำนึงถึงราคาที่เหมาะสมและความปลอดภัย การให้ คำปรึกษาเรื่องการวางแผนใช้จ่ายของผู้รับทุน แนวทางการป้องกันยาเสพติดและอบายมุข ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.19 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 255, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('การเตรียม ความพร้อมและสนับสนุนช่วยเหลือทั้งด้านการวิชาการและทางสังคมให้แก่ผู้รับทุน ระบบดูแลความ เป็นอยู่และสวัสดิภาพของผู้รับทุน ต้องครอบคลุมทั้งในด้านสภาพแวดล้อม ความเป็นอยู่ สวัสดิภาพ ด้านร่างกาย  ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 255, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('จิตใจ อารมณ์และสังคม รวมถึงการพัฒนาทักษะการเรียนรู้ ทักษะชีวิต ทักษะสังคม และมีมาตรการในการดูแลและป้องกันปัญหา ติดตาม เฝ้าระวัง และมีระบบการแก้ไขปัญหาเป็น เฉพาะบุคคลเมื่อพบกรณีผิดปกติที่จะส่งผล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 255, "h": 6.5, "bd": border }
        doc.font(Italic).fillColor("black").text('ให้ผู้รับทุนเรียนไม่จบตามกำหนด ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });

        // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

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

                columnSpacing: 2,
                padding: 2,
                prepareHeader: (x) => {
                    doc.font(Bold).fontSize(12).fillColor('black')
                },
                prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                    if (indexColumn === 0) {
                        doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                    }
                    doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                    doc.font(ThS).fontSize(12).fillColor('black')
                },
                columnsSize: [cov(50), cov(50), cov(50), cov(50), cov(50)],
                x: cov(25), y: cov(voc(doc.y))
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
        return null
    }

};


export const PDF7 = async (req) => {

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
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        // console.log(Dorm)

        s = { "x": 20, "y": 20, "w": 170, "h": 5, "bd": border }
        doc.font(Italic).fillColor("black").text('     1) ประเด็น : การเตรียมความพร้อมก่อนเข้าเรียน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.42 });

        // s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        // doc.font(Italic).fillColor("black").text('และการใช้ชีวิตก่อนการศึกษาให้แก่ผู้เรียนที่มีความต้องการพิเศษที่ได้รับทุนอย่างไร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });

        // s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        // doc.font(Italic).fillColor("black").text('ตามหลักสูตรอย่างไร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['h'] + s['y'], "w": 52, "h": 5, "bd": border }
        doc.font(Bold).fillColor("black").text('กระบวนการ/วิธีการ/แนวทางการดำเนินงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'])).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'])).undash().stroke()

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การประชุมทำความเข้าใจนักศึกษา ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_student_meet != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การประชุมทำความเข้าใจผู้ปกครอง ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_parent_meet != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การตรวจสุขภาพก่อนเปิดภาคการศึกษา ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_health_check != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การปรับพื้นฐานทางด้านวิชาการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_adjust_the_basics != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 19, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ โปรดระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_other1 != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Dorm.dc_other1 != "" ? Dorm.dc_other1_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


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

export const PDF8 = async (req) => {

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
        doc.font(Italic).fillColor("black").text('     3) ประเด็น : การให้คำปรึกษาทางวิชาการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.35 });

        // s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        // doc.font(Italic).fillColor("black").text('ของการศึกษาเพื่อให้สำเร็จการศึกษาตามที่กำหนดอย่างไร รวมถึงมาตรการป้องกันไม่ให้เกิดปัญหาทางวิชาการและมิติอื่น ๆ ที่จะทำให้ผู้รับทุนไม่สำเร็จ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.12 });

        // s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        // doc.font(Italic).fillColor("black").text('การศึกษาตามกำหนด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['h'] + s['y'], "w": 52, "h": 5, "bd": border }
        doc.font(Bold).fillColor("black").text('กระบวนการ/วิธีการ/แนวทางการดำเนินงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'])).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'])).undash().stroke()

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การเรียนปรับพื้นฐานตามความจำเป็นของสาขาวิชาชีพ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_adjustments_memory != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การสอนเสริมนอกเวลาในรายวิชาที่นักศึกษามีปัญหา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_part_time_teaching != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('กิจกรรมการเรียนรู้สภาพชุมชนท้องถิ่นภูมิลำเนาและรอบสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_domicile != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การพัฒนาทัศนคติ และเจตคติ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_attitude != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การอยู่ร่วมกันและการทำงานเป็นทีม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_teamwork != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การป้องกันและต่อต้านยาเสพติด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_anti_drug != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 19, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ โปรดระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_other2 != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Dorm.dc_other2 != "" ? Dorm.dc_other2_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


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

export const PDF9 = async (req) => {

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
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        // console.log(Dorm)

        s = { "x": 20, "y": 20, "w": 170, "h": 5, "bd": border }
        doc.font(Italic).fillColor("black").text('     5) ประเด็น : สถานศึกษาของท่านมีแนวทางในการให้คำปรึกษาและพัฒนาทักษะเรื่องการวางแผนใช้จ่ายของผู้รับทุน หรือมีแนวทางในการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });

        s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        doc.font(Italic).fillColor("black").text('ส่งเสริมความรู้ ทักษะ และวินัยทางการเงิน รวมถึงแนวทางการบริหารจัดการเงิน ในกรณีที่นักศึกษาได้รับอัตราค่าจ้างจากการฝึกประสบการณ์วิชาชีพ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });

        s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        doc.font(Italic).fillColor("black").text('ตามหลักสูตรอย่างไร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['h'] + s['y'], "w": 52, "h": 5, "bd": border }
        doc.font(Bold).fillColor("black").text('กระบวนการ/วิธีการ/แนวทางการดำเนินงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'])).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'])).undash().stroke()

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('กิจกกรรมส่งเสริมการออม ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_promote_savings != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 100, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('การจัดทำบัญชีรายรับรายจ่าย และนำมาวางแผนการใช้จ่ายเงิน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_plan_money != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 19, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ โปรดระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_other3 != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Dorm.dc_other3 != "" ? Dorm.dc_other3_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


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

export const PDF10 = async (req) => {

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
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        // console.log(Dorm)

        s = { "x": 20, "y": 20, "w": 170, "h": 5, "bd": border }
        doc.font(Italic).fillColor("black").text('     6) ประเด็น : กลไกการติดตามดูแลและให้แนวทางในการให้คำปรึกษาเรื่องทักษะชีวิตและสังคม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.52 });
        // s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        // doc.font(Italic).fillColor("black").text('การป้องกันยาเสพติดและอบายมุข (เหล้า บุหรี่) การป้องกันโรคติดต่อทางเพศสัมพันธ์ การตั้งครรภ์ในวัยเรียน และอื่น ๆ ของผู้เรียนที่มีความต้องการพิเศษ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        // s = { "x": 20, "y": s['h'] + s['y'], "w": 170, "h": 5, "bd": border }
        // doc.font(Italic).fillColor("black").text('ที่ได้รับทุนอย่างไร ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['h'] + s['y'], "w": 52, "h": 5, "bd": border }
        doc.font(Bold).fillColor("black").text('กระบวนการ/วิธีการ/แนวทางการดำเนินงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'])).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'])).undash().stroke()

        s = { "x": 30, "y": s['h'] + s['y'] + 3, "w": 170, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('กิจกรรมการการให้คำปรึกษาด้านสุขภาพกายและสุขภาพจิตและความเป็นอยู่ของนักศึกษา โดยอาจารย์และความร่วมมือกับองค์กรภายนอก ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_external_organization != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }

        s = { "x": 30, "y": s['h'] + s['y'] + 2, "w": 19, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('อื่น ๆ โปรดระบุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        doc.lineJoin('miter').rect(cov(s['x'] - 7), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (Dorm.dc_other4 != "") {
            doc.image('img/check.png', cov(s['x'] - 7), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 139, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Dorm.dc_other4 != "" ? Dorm.dc_other4_oth : "", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


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


export const PDF11 = async (req) => {

    const Course = req['Course']

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
                s = { "x": 20, "y": 20, "w": 52, "h": 5, "bd": border }
            }

            s = { "x": 25, "y": s['y'] + s['h'], "w": 24, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("หลักสูตรสาขาวิชา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 142, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.m_major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 25, "y": s['y'] + s['h'], "w": 14, "h": 5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("สาขางาน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 152, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.m_work, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0.17 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


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

            s = { "x": 25, "y": (voc(doc.y) + 6.5), "w": 165, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('วิธีดำเนินการที่สอดคล้องกับหลักสูตรสาขาวิชา/สาขางาน โดยระบุรายวิชาและวิธีการที่ศึกษาในสถานประกอบการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();


            s = { "x": 25, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_continue.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
            console.log("xxx", +voc(doc.y))
            if (voc(doc.y) > 250) {
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
            }

            s = { "x": 25, "y": (voc(doc.y) + 6.5), "w": 165, "h": 5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('วิธีการบริหารจัดการและการติดตามในการนิเทศก์นักศึกษาในสถานประกอบการ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();


            s = { "x": 25, "y": s['y'] + s['h'], "w": 140, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(d.c_manage.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
            console.log("xxx", +voc(doc.y))
            if (voc(doc.y) > 250) {
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
            }


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
            // if (d.c_semester5 != '') { c_data_year.push("1/2569") }
            // if (d.c_semester6 != '') { c_data_year.push("2/2569") }

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
            // if (d.c_summer2 != '') { c_data2_year.push("3/2569") }


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
            s = { "x": 25, "y": 20, "w": 165, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('ความร่วมมือกับหน่วยงานภาคเอกชน/ภาคผู้ประกอบการที่สอดคล้อดกับสาขาวิชา/สาขางาน ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();



            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่ร่วมมือ 2 ปีที่ผ่านมา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_agency1.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
            console.log(d.c_agency1)
            // console.log("หน่วยงานที่ร่วมมือ 2 ปีที่ผ่านมา : ----------------", voc(doc.y))
            // if (voc(doc.y) > 240) {

            //     doc.addPage({
            //         size: 'A4',
            //         layout: `portrait`,
            //         // layout: `landscape`,
            //         margins: {
            //             top: 50,
            //             bottom: 0,
            //             left: 72,
            //             right: 72,
            //         }
            //     })
            // }
            s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่ร่วมมือในปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_agency2.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
            // console.log("หน่วยงานที่ร่วมมือในปัจจุบัน : ----------------", voc(doc.y))
            // if (voc(doc.y) > 240) {

            //     doc.addPage({
            //         size: 'A4',
            //         layout: `portrait`,
            //         // layout: `landscape`,
            //         margins: {
            //             top: 50,
            //             bottom: 0,
            //             left: 72,
            //             right: 72,
            //         }
            //     })
            // }
            s = { "x": 25, "y": voc(doc.y), "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('หน่วยงานที่คาดว่าจะร่วมมือในอนาคต', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            s = { "x": 25, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text("       " + d.c_agency3.replaceAll("\r\n", "\n"), cov(s['x']), cov(s['y']), { width: cov(s['w']), align: 'left', characterSpacing: 0.17 });
            // console.log("หน่วยงานที่คาดว่าจะร่วมมือในอนาคต : ----------------", voc(doc.y))
            // if (voc(doc.y) > 240) {

            //     doc.addPage({
            //         size: 'A4',
            //         layout: `portrait`,
            //         // layout: `landscape`,
            //         margins: {
            //             top: 50,
            //             bottom: 0,
            //             left: 72,
            //             right: 72,
            //         }
            //     })
            // }
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
        return null
    }
};


export const PDF12 = async (req) => {

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
        doc.font(Bold).fontSize(14).fillColor("black").text('11.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 56, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(14).fillColor('black').text(" ผลผลิตและผลลัพธ์ที่สำคัญของโครงการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 131, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("(สำหรับสถานศึกษาที่ผ่านการพิจารณาคัดเลือกจะต้องดำเนินการตลอด", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.9 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 150, "h": 6.5, "bd": border }
        doc.font(Italic).fontSize(14).fillColor('black').text("ระยะเวลาโครงการ)", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        let chkRows = 4

        let pD3 = [
            ['1', 'รายงานความก้าวหน้าของสถานศึกษารายภาคเรียนในการพัฒนาคุณภาพนักศึกษาและสถานศึกษาตามกรอบที่ กสศ. กำหนด'],
            ['2', 'รายงานความก้าวหน้าของนักศึกษาผู้รับทุนตามระยะเวลาที่กำหนด ได้แก่ ผลการเรียน แฟ้มสะสมผลงาน (Portfolio) ที่แสดงผลการพัฒนาของเด็กทั้งด้านผลการเรียน ทักษะการเรียนรู้และพฤติกรรม รวมถึงความเสี่ยงต่าง ๆ'],
            ['3', 'รายงานความก้าวหน้าการพัฒนาผู้รับทุนให้มีทักษะวิชาชีพเฉพาะทางในสาขาที่เรียน สามารถประกอบอาชีพได้'],
            ['4', 'รายงานการเงินตามแบบฟอร์มของ กสศ. และในกรณีที่ได้รับเงินงวดตั้งแต่ 500,000 บาทขึ้นไป จะต้องจัดให้มีผู้สอบบัญชีตรวจสอบและรายงานผลการตรวจสอบรายงานการเงินด้วย']
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
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

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

            columnSpacing: 2,
            padding: 2,
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

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
        return null
    }
};


export const PDF13 = async (req) => {
    const MarkerUp = req['MarkerUp'] == null ? [] : req['MarkerUp']
    const MarkerDown = req['MarkerDown'] == null ? [] : req['MarkerDown']
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
        doc.font(Bold).fillColor("black").text('14. ตัวชี้วัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 5, "bd": border }
        doc.font(ThS).fillColor("black").text('ตัวชี้วัดโครงการ คือ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });

        let Up = [
            // ["อัตราการคงอยู่ของนักศึกษาผู้รับทุนในปีที่ 1 ต่อจำนวนนักศึกษาผู้รับทุนทั้งหมด ร้อยละ "],
            // ["อัตราการสำเร็จการศึกษาของนักศึกษาผู้รับทุนในระยะเวลา 2 ปี ต่อจำนวนนักศึกษาผู้รับทุนทั้งหมด ร้อยละ "],
            // ["อัตราการเข้าสู่งานอาชีพเมื่อสำเร็จการศึกษา ร้อยละ "],
            // ["นักศึกษาผู้รับทุนได้รับการศึกษาจนสำเร็จการศึกษาในระดับประกาศนียบัตรวิชาชีพ และได้รับการพัฒนาศักยภาพ มีโอกาสชีวิตและอาชีพสามารถพึ่งพาตนเองได้ โดยการเตรียมความพร้อมด้านอาชีพมีความหมายต่อชีวิตจริงของนักศึกษา ตลอดจนได้รับการดูแลสวัสดิภาพ สุขภาพ และพัฒนาทักษะชีวิตที่เหมาะสมสำหรับโลกยุคปัจจุบัน"],
            // ["มีโอกาสชีวิตและอาชีพสามารถพึ่งพาตนเองได้ โดยการเตรียมความพร้อมด้านอาชีพมีความหมายต่อชีวิตจริงของนักศึกษา ตลอดจนได้รับการดูแลสวัสดิภาพ สุขภาพ และพัฒนาทักษะชีวิตที่เหมาะสมสำหรับโลกยุคปัจจุบัน"],
            // ["สถานศึกษาสามารถพัฒนาหลักสูตรหรือกระบวนการเรียนการสอนที่ทำให้เกิดสมรรถนะ (Competencies) สอดคล้องกับความต้องการของตลาดแรงงาน รวมถึงการเป็นผู้ประกอบการเอง มีต้นแบบแนวทางในการจัดการศึกษาสายอาชีพที่นำไปต่อยอดได้"],
            // ["สถานศึกษาจัดระบบการร่วมงานกับเอกชนหรือแหล่งงานภายนอกเพื่อโอกาสการมีงานทำหรือศึกษาต่อของนักศึกษาหลังจบหลักสูตร"],
        ]
        let kuy = 0
        if (MarkerUp.length > 0) {
            for await (let X of MarkerUp) {
                // if (kuy <= 6) {
                //     Up[kuy][0] += X.mk_data1
                // } else {
                Up.push(
                    [
                        X.mk_data.replaceAll("\r\n", "\n") + " " + X.mk_data1.replaceAll("\r\n", "\n")
                    ]
                )
                // }
                // kuy++
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

            columnSpacing: 2,
            padding: 2,
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

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
                        "- " + X.mk_data1.replaceAll("\r\n", "\n")
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

            columnSpacing: 2,
            padding: 2,
            prepareHeader: (x) => {
                doc.font(Bold).fontSize(12).fillColor('black')
            },
            prepareRow: async (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (indexColumn === 0) {
                    doc.lineWidth(.5).moveTo(rectCell.x, rectCell.y).lineTo(rectCell.x, rectCell.y + rectCell.height).stroke();
                }
                doc.lineWidth(.5).moveTo(rectCell.x + rectCell.width, rectCell.y).lineTo(rectCell.x + rectCell.width, rectCell.y + rectCell.height).stroke();

                doc.font(ThS).fontSize(12).fillColor('black')
            },
            columnsSize: [cov(160)],
            x: cov(25), y: doc.y
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



export const PDF14 = async (req) => {

    const Users = req['Users']['0']
    const CeoData = req['Person']['Ceo']
    const ManageData = req['Person']['Manage']
    const EmpData = req['Person']['Emp']
    const TypesPee = req['TypesPee']


    let ceo_prefix = CeoData.p_prefix
    let ceo_prefixname_oth = CeoData.p_prefix_oth
    let ceo_name = CeoData.p_firstname
    let ceo_surname = CeoData.p_lastname
    const ManageMain = req['Person']['ManageMain'][0]

    const res_prefix = ManageMain['p_prefix']
    const res_prefixname_oth = ManageMain['p_prefix_oth']
    const res_name = ManageMain['p_firstname']
    const res_surname = ManageMain['p_lastname']

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
        s = { "x": 20, "y": s['y'] + s['h'] + 3, "w": 170, "h": 6.5, "bd": border }
        doc.font(Bold).fontSize(16).fillColor("black").text('โปรดยืนยันเพื่อเป็นแนวปฏิบัติตามหลักการของสถานศึกษาที่เสนอโครงการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 40, "y": s['y'] + s['h'] + 7, "w": 11, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 119, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text(Users.u_school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 149, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor('black').text("ได้ศึกษาประกาศ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('สำนักงาน กสศ. เรื่อง เปิดรับโครงการทุนนวัตกรรมสายอาชีพชั้นสูง สำหรับผู้เรียนที่มีความต้องการพิเศษ ปีการศึกษา 2567 รวมถึง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.12 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('แนวทางและเงื่อนไขการสนับสนุนการดำเนินงานโครงการของ กสศ. โดยละเอียดแล้ว และขอรับรองว่า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(1) ข้อความ ข้อมูล และรายละเอียดต่าง ๆ ที่ข้าพเจ้าได้ให้ไว้ในแบบเสนอโครงการเป็นความจริงทุกประการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.47 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ซึ่งหากระหว่างการพิจารณาคัดเลือกข้อเสนอโครงการนี้ กสศ. ตรวจพบว่ามีข้อความ ข้อมูล หรือรายละเอียดต่าง ๆ อื่นใดเป็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.34 });

        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('เป็นเท็จ หรือปกปิดข้อความจริงอันควรแจ้งให้ทราบ โครงการจะไม่ได้รับการพิจารณา และในกรณีมีการอนุมัติและเบิกจ่ายเงิน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.31 });

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
        doc.font(ThS).fontSize(14).fillColor("black").text('  ดังกล่าวข้างต้น จะเป็นไปเพื่อประโยชน์แก่ข้าพเจ้าและไม่เป็นการแสวงหาผลกำไร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.38 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(8) การยื่นข้อเสนอตามโครงการนี้ ไม่ก่อให้ข้าพเจ้ามีสิทธิเรียกร้องค่าธรรมเนียม ค่าเสียหาย หรือค่าใช้จ่ายอื่นใด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.3 });

        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(9) ข้าพเจ้าจะเรียกเก็บค่าธรรมเนียมการศึกษาตามหลักสูตรจาก กสศ. เท่านั้น และห้ามสถานศึกษาเรียกเก็บ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.45 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('ค่าธรรมเนียมการศึกษาจากนักศึกษาผู้รับทุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 40, "y": s['y'] + s['h'], "w": 165, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('(10) ผู้รับผิดชอบโครงการในแต่ละสาขางานได้รับทราบและพร้อมที่จะปฏิบัติตามข้อเสนอแนะของคณะหนุน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.49 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 175, "h": 6.5, "bd": border }
        doc.font(ThS).fontSize(14).fillColor("black").text('เสริมและ กสศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


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

export const PDF15 = async (req) => {

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


export const PDF16 = async (req) => {

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



export const TestPdfSp = async (req, res) => {
    const u_id = req.params.u_id
    const u_type = req.params.u_type
    const u_type2 = req.params.u_type2
    const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await PDF2(data);
    res.send("<iframe width='100%' download='browser.pdf' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
}


// export const PdfSp1 = async (req, res) => {
// console.log("xxxxxxxxxxxxxxxxxx", req.body)
//     const pdfBase64 = await PDF(req.body);
//     res.send("data:application/pdf;base64," + pdfBase64 + "")
// }

