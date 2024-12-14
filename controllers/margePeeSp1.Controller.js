import PDFMerge from 'pdf-merger-js';
import axios from 'axios'
import https from 'https'
import pool from '../config/connect_eef.js';
import * as Pages from './eef.Controller.js';
import fs from 'fs';

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
        console.log(sqlDorm)
        const [resDorm] = await connection.query(sqlDorm)
        if (resDorm.length > 0) {
            Objs['Dorm'] = resDorm;
        }

        const sqlDormSub = `SELECT * FROM innovet_2024_dorm WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        const [resDormSub] = await connection.query(sqlDormSub)
        if (resDormSub.length > 0) {
            Objs['DormSub'] = resDormSub;
        }

        const sqlArea = `SELECT a.*, b.m_major, b.m_work FROM innovet_2024_teach_place a INNER JOIN innovet_2024_major b ON a.m_id = b.m_id WHERE a.u_id = '${u_id}' AND b.u_type = '${u_type}'`
        const [resArea] = await connection.query(sqlArea)
        if (resArea.length > 0) {
            Objs['Area'] = resArea;
        }

        const sqlAreaHeight = `SELECT a.*, b.mh_major, b.mh_work FROM innovet_2024_teach_place_height a INNER JOIN innovet_2024_major_height b ON a.mh_id = b.mh_id WHERE a.u_id = '${u_id}' AND b.u_type = '${u_type}'`
        console.log(sqlAreaHeight)
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

        const sqlFiles = `SELECT  concat('https://eefinnovet.com/',f_folder2) as f_folder2,u_section FROM innovet_2024_files WHERE u_type = '${u_type}' AND u_id = '${u_id}'`
        const [resFiles] = await connection.query(sqlFiles)
        if (resFiles.length > 0) {
            Objs['Files'] = {}
            for await (const i of resFiles) {
                // console.log(i)

                // Objs['Files'].push({'':''})
                Objs['Files'][i.u_section] = i.f_folder2
            }
            // Objs['Files'] = resFiles;
        }
        // 
        // console.log(Objs['Main'])
        return Objs
    } catch (error) {
        console.log(error)
        return false
    }
}


const margePdf = async (data) => {
    // console.log(data['Files'])

    try {

        const Page1 = await Pages.PDF1(data)
        const Page2 = await Pages.PDF2(data)
        const Page3 = await Pages.PDF3(data)
        const Page4 = await Pages.PDF4(data)
        const Page5 = await Pages.PDF5(data)
        const Page6 = await Pages.PDF6(data)
        const Page7 = await Pages.PDF7(data)
        const Page8 = await Pages.PDF8(data)
        const Page9 = await Pages.PDF9(data)
        const Page10 = await Pages.PDF10(data)
        const Page11 = await Pages.PDF11(data)

        const SortData = {
            "P1": Page1,
            "โครงสร้างการบริหารโครงการ": data['Files']["โครงสร้างการบริหารโครงการ"],
            "P6": Page6,
            "ในกรณีที่โครงการที่ได้รับทุน จาก กสศ.": data['Files']["ในกรณีที่โครงการที่ได้รับทุน จาก กสศ."],
            "P2": Page2,
            "หลักการและเหตุผล": data['Files']["หลักการและเหตุผล"],
            "การประเมินประสิทธิภาพองค์กร": data['Files']["การประเมินประสิทธิภาพองค์กร"],
            "P3": Page3,
            "ข้อมูลความขาดแคลนและความต้องการแรงงาน": data['Files']["ข้อมูลความขาดแคลนและความต้องการแรงงาน"],
            "ข้อมูลสนับสนุนที่สะท้อนถึงผลการดำเนินงาน": data['Files']["ข้อมูลสนับสนุนที่สะท้อนถึงผลการดำเนินงาน"],
            "P5": Page5,
            "ความพร้อมและความเชื่อมั่น ในการดำเนินโครงการให้ประสบความสำเร็จตามเป้าหมาย": data['Files']["ความพร้อมและความเชื่อมั่น ในการดำเนินโครงการให้ประสบความสำเร็จตามเป้าหมาย"],
            "แนวทางในการแนะแนวและประชาสัมพันธ์ทุนการศึกษา": data['Files']["แนวทางในการแนะแนวและประชาสัมพันธ์ทุนการศึกษา"],
            "P4": Page4,
            "วิธีการบริหารจัดการหาหอพักให้นักศึกษาผู้รับทุน": data['Files']["วิธีการบริหารจัดการหาหอพักให้นักศึกษาผู้รับทุน"],
            "การจัดหอพักและระบบดูแลที่ดีและเอื้อต่อการเรียนรู้": data['Files']["การจัดหอพักและระบบดูแลที่ดีและเอื้อต่อการเรียนรู้"],
            "แนวทางพัฒนาระบบดูแลนักศึกษาทุนเรื่องความเป็นอยู่": data['Files']["แนวทางพัฒนาระบบดูแลนักศึกษาทุนเรื่องความเป็นอยู่"],
            "แนวทางในการเตรียมความพร้อมก่อนเข้าเรียน": data['Files']["แนวทางในการเตรียมความพร้อมก่อนเข้าเรียน"],
            "แนวทางในการพัฒนาหลักสูตรและกระบวนการเรียนการสอนให้มีคุณภาพสูง 2": data['Files']["แนวทางในการพัฒนาหลักสูตรและกระบวนการเรียนการสอนให้มีคุณภาพสูง 2"],
            "wil": data['Files']["wil"],
            "แนวทางในการพัฒนาหลักสูตรและกระบวนการเรียนการสอนให้มีคุณภาพสูง": data['Files']["แนวทางในการพัฒนาหลักสูตรและกระบวนการเรียนการสอนให้มีคุณภาพสูง"],
            "แนวทางในการส่งเสริมโอกาสการมีงานทำแก่ผู้รับทุน": data['Files']["แนวทางในการส่งเสริมโอกาสการมีงานทำแก่ผู้รับทุน"],
            "แผนการดำเนินโครงการและกิจกรรมสำคัญ": data['Files']["แผนการดำเนินโครงการและกิจกรรมสำคัญ"],
            "P9": Page9,
            "P10": Page10,
            "ระบุความต่อเนื่องยั่งยืน": data['Files']["ระบุความต่อเนื่องยั่งยืน"],
            "ตัวชี้วัด": data['Files']["ตัวชี้วัด"],
            "P11": Page11,
            "ประวัติผู้รับผิดชอบโครงการโดยย่อ": data['Files']["ประวัติผู้รับผิดชอบโครงการโดยย่อ"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 1": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 1"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 2": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 2"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 3": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 3"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 4": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 4"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 5": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 5"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 6": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 6"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 7": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 7"],

            "แผนผังและภาพของอาคารสถานที่ 1": data['Files']["แผนผังและภาพของอาคารสถานที่ 1"],
            "แผนผังและภาพของอาคารสถานที่ 2": data['Files']["แผนผังและภาพของอาคารสถานที่ 2"],
            "แผนผังและภาพของอาคารสถานที่ 3": data['Files']["แผนผังและภาพของอาคารสถานที่ 3"],
            "แผนผังและภาพของอาคารสถานที่ 4": data['Files']["แผนผังและภาพของอาคารสถานที่ 4"],
            "แผนผังและภาพของอาคารสถานที่ 5": data['Files']["แผนผังและภาพของอาคารสถานที่ 5"],
            "แผนผังและภาพของอาคารสถานที่ 6": data['Files']["แผนผังและภาพของอาคารสถานที่ 6"],
            "แผนผังและภาพของอาคารสถานที่ 7": data['Files']["แผนผังและภาพของอาคารสถานที่ 7"],

            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 1": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 1"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 2": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 2"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 3": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 3"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 4": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 4"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 5": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 5"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 6": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 6"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 7": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 7"],


            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 1": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 1"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 2": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 2"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 3": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 3"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 4": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 4"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 5": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 5"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 6": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 6"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 7": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 7"],


            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 1": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 1"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 2": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 2"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 3": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 3"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 4": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 4"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 5": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 5"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 6": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 6"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 7": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 7"],

            "แผนผังจากหอพักนักศึกษาถึงสถานที่เรียน": data['Files']["แผนผังจากหอพักนักศึกษาถึงสถานที่เรียน"],
            "แผนผังและภาพของอาคารสถานที่/ห้องปฏิบัติการ และแหล่งเรียนรู้หรืออื่น ๆ ที่เกี่ยวข้องที่สำคัญกับการจัดการศึกษาในหลักสูตร/สาขาที่เสนอ ไม่เกิน 10 ภาพในทุกหลักสูตรสาขาวิชา/สาขางานเท่านั้น": data['Files']["แผนผังและภาพของอาคารสถานที่/ห้องปฏิบัติการ และแหล่งเรียนรู้หรืออื่น ๆ ที่เกี่ยวข้องที่สำคัญกับการจัดการศึกษาในหลักสูตร/สาขาที่เสนอ ไม่เกิน 10 ภาพในทุกหลักสูตรสาขาวิชา/สาขางานเท่านั้น"],
            "ภาพถ่ายหอพักนักศึกษา": data['Files']["ภาพถ่ายหอพักนักศึกษา"],
            "ประกาศอัตราการเรียกเก็บค่าเช่าหอพักและค่าสาธารณูปโภค": data['Files']["ประกาศอัตราการเรียกเก็บค่าเช่าหอพักและค่าสาธารณูปโภค"],
            "ประวัติผู้รับผิดชอบโครงการโดยย่อ": data['Files']["ประวัติผู้รับผิดชอบโครงการโดยย่อ"],
            "หลักฐานการประกันการมีงานทำ": data['Files']["หลักฐานการประกันการมีงานทำ"],

            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 1": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 1"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 2": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 2"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 3": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 3"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 4": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 4"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 5": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 5"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 6": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 6"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 7": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 7"],

            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 1": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 1"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 2": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 2"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 3": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 3"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 4": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 4"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 5": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 5"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 6": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 6"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 7": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 7"],
            "แบบแสดงความประสงค์การเข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง": data['Files']["แบบแสดงความประสงค์การเข้าร่วมโครงการทุนนวัตกรรมสายอาชีพชั้นสูง"],
            "หลักฐานที่แสดงถึงแนวทางการขยายผลการดำเนินโครงการ": data['Files']["หลักฐานที่แสดงถึงแนวทางการขยายผลการดำเนินโครงการ"],
            "เอกสารอื่น ๆ 1": data['Files']["เอกสารอื่น ๆ 1"],
            "เอกสารอื่น ๆ 2": data['Files']["เอกสารอื่น ๆ 2"],
            "เอกสารอื่น ๆ 3": data['Files']["เอกสารอื่น ๆ 3"],
            "P7": Page7,
            "คำรับรอง": data['Files']["คำรับรอง"],
        }

        // console.log(SortData)

        const merger = new PDFMerge();

        for await (const i of Object.entries(SortData)) {
            if (i[0].substring(0, 1) != 'P') {
                if (i[1] != null) {
                    // console.log(i)
                    const response = await axios.get(i[1], {
                        responseType: 'arraybuffer', httpsAgent: new https.Agent({
                            rejectUnauthorized: false,
                            key: fs.readFileSync("ssl/thaijobjob.key"),
                            cert: fs.readFileSync("ssl/thaijobjob.crt"),
                            ca: fs.readFileSync('ssl/thaijobjob.CA.crt')
                        })
                    })
                    const buffer = Buffer.from(response.data, "utf-8")
                    await merger.add(buffer);
                }
            } else {
                if (i[1] != null) {
                    const myBuffer1 = Buffer.from(i['1'], 'base64');
                    await merger.add(myBuffer1);
                }
            }

        }



        const mergedPdfBuffer = await merger.saveAsBuffer();
        return mergedPdfBuffer
    } catch (error) {
        console.log(error)
        return {}
    }


}


export const MainPee1 = async (req, res) => {
    const u_id = req.params.u_id
    const u_type = req.params.u_type
    const u_type2 = req.params.u_type2
    const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await margePdf(data);
    res.contentType("application/pdf");
    res.send(pdfBase64)
}

export const MainPee = async (req, res) => {
    const u_id = req.params.u_id
    const u_type = req.params.u_type
    const u_type2 = req.params.u_type2
    const data = await getData(u_id, u_type, u_type2);
    const pdfBase64 = await margePdf(data);
    const Names = {
        "8_2_ทั่วไป": "GA672022_วิทยาลัยเทคนิคตระการพืชผล_2ปี",
        "8_5_ทั่วไป": "GA675023_วิทยาลัยเทคนิคตระการพืชผล_5ปี",
        "9_2_ทั่วไป": "GA672024_วิทยาลัยการอาชีพโนนดินแดง_2ปี",
        "9_5_ทั่วไป": "GA675025_วิทยาลัยการอาชีพโนนดินแดง_5ปี",
        "10_2_ทั่วไป": "GA672136_วิทยาลัยสารพัดช่างสุรินทร์_2ปี",
        "11_2_ทั่วไป": "GA672026_วิทยาลัยเทคโนโลยีพุทธเกษม_2ปี",
        "11_5_ทั่วไป": "GA675027_วิทยาลัยเทคโนโลยีพุทธเกษม_5ปี",
        "12_2_ทั่วไป": "GB672137_วิทยาลัยเกษตรและเทคโนโลยีตรัง_2ปี",
        "13_2_ทั่วไป": "GA672028_วิทยาลัยเทคนิคนครอุบลราชธานี_2ปี",
        "13_5_ทั่วไป": "GA675029_วิทยาลัยเทคนิคนครอุบลราชธานี_5ปี",
        "14_2_ทั่วไป": "GB672030_วิทยาลัยเทคโนโลยีกรุงธนเชียงรายไทยเยอรมัน_2ปี",
        "15_1_ทั่วไป": "GA671001_คณะพยาบาลศาสตร์วิทยาลัยเชียงราย_1ปี",
        "18_2_ทั่วไป": "GA672034_วิทยาลัยเกษตรและเทคโนโลยีขอนแก่น_2ปี",
        "18_5_ทั่วไป": "GA675035_วิทยาลัยเกษตรและเทคโนโลยีขอนแก่น_5ปี",
        "19_2_ทั่วไป": "GA672036_วิทยาลัยการอาชีพจอมทอง_2ปี",
        "19_5_ทั่วไป": "GA675037_วิทยาลัยการอาชีพจอมทอง_5ปี",
        "20_1_ทั่วไป": "GA671002_คณะพยาบาลศาสตร์มหาวิทยาลัยศรีนครินทรวิโรฒ_1ปี",
        "21_2_ทั่วไป": "GA672038_วิทยาลัยการอาชีพกาฬสินธุ์_2ปี",
        "21_5_ทั่วไป": "GA675039_วิทยาลัยการอาชีพกาฬสินธุ์_5ปี",
        "22_2_ทั่วไป": "GA672138_วิทยาลัยเทคนิคนครลำปาง_2ปี",
        "23_5_ทั่วไป": "GB672182_วิทยาลัยเทคโนโลยีพาณิชยการลานนา_5ปี",
        "24_2_ทั่วไป": "GB672040_วิทยาลัยประมงติณสูลานนท์_2ปี",
        "24_5_ทั่วไป": "GB675041_วิทยาลัยประมงติณสูลานนท์_5ปี",
        "25_2_ทั่วไป": "GA672042_วิทยาลัยเทคนิคเชียงใหม่_2ปี",
        "25_5_ทั่วไป": "GA675043_วิทยาลัยเทคนิคเชียงใหม่_5ปี",
        "26_2_ทั่วไป": "GB672044_วิทยาลัยการอาชีพวิเชียรบุรี_2ปี",
        "26_5_ทั่วไป": "GB675045_วิทยาลัยการอาชีพวิเชียรบุรี_5ปี",
        "27_2_ทั่วไป": "GA672046_วิทยาลัยเกษตรและเทคโนโลยีชัยภูมิ_2ปี",
        "27_5_ทั่วไป": "GA675047_วิทยาลัยเกษตรและเทคโนโลยีชัยภูมิ_5ปี",
        "28_2_ทั่วไป": "GA672139_วิทยาลัยอาชีวศึกษาเชียงใหม่_2ปี",
        "29_5_ทั่วไป": "GA675049_วิทยาลัยเทคนิคกาญจนาภิเษกสมุทรปราการ_5ปี",
        "30_2_ทั่วไป": "GA672140_วิทยาลัยเกษตรและเทคโนโลยีศูนย์ศิลปาชีพบางไทร_2ปี",
        "31_2_นวัตกรรม": "IA672050_วิทยาลัยเทคโนโลยีชลบุรี_2ปี",
        "31_5_นวัตกรรม": "IA675051_วิทยาลัยเทคโนโลยีชลบุรี_5ปี",
        "34_2_ทั่วไป": "GA672054_วิทยาลัยการอาชีพป่าซาง_2ปี",
        "34_5_ทั่วไป": "GA675055_วิทยาลัยการอาชีพป่าซาง_5ปี",
        "35_2_ทั่วไป": "GA672142_วิทยาลัยชุมชนนราธิวาส_2ปี",
        "36_5_ทั่วไป": "GA675183_วิทยาลัยเทคนิคพระนครศรีอยุธยา_5ปี",
        "37_2_ทั่วไป": "GA672056_วิทยาลัยเทคโนโลยีโปลิเทคนิคลานนาเชียงใหม่_2ปี",
        "37_5_ทั่วไป": "GA675057_วิทยาลัยเทคโนโลยีโปลิเทคนิคลานนาเชียงใหม่_5ปี",
        "38_2_ทั่วไป": "GA672058_วิทยาลัยเกษตรและเทคโนโลยีชลบุรี_2ปี",
        "38_5_ทั่วไป": "GA675059_วิทยาลัยเกษตรและเทคโนโลยีชลบุรี_5ปี",
        "40_2_ทั่วไป": "GA672143_วิทยาลัยเกษตรและเทคโนโลยีบุรีรัมย์_2ปี",
        "41_1_ทั่วไป": "GB671003_คณะพยาบาลศาสตร์มหาวิทยาลัยพะเยา_1ปี",
        "57_5_นวัตกรรม": "IA675187_วิทยาลัยเทคโนโลยีสยาม(สยามเทค)_5ปี",
        "43_2_นวัตกรรม": "IA672060_วิทยาลัยเทคนิคพังงา_2ปี",
        "43_5_นวัตกรรม": "IA675061_วิทยาลัยเทคนิคพังงา_5ปี",
        "44_2_ทั่วไป": "GA672062_วิทยาลัยเกษตรและเทคโนโลยีนราธิวาสมหาวิทยาลัยนราธิวาสราชนครินทร์_2ปี",
        "44_5_ทั่วไป": "GA675063_วิทยาลัยเกษตรและเทคโนโลยีนราธิวาสมหาวิทยาลัยนราธิวาสราชนครินทร์_5ปี",
        "45_2_ทั่วไป": "GB672064_วิทยาลัยอาชีวศึกษาร้อยเอ็ด_2ปี",
        "45_5_ทั่วไป": "GB675065_วิทยาลัยอาชีวศึกษาร้อยเอ็ด_5ปี",
        "42_2_นวัตกรรม": "IA672132_วิทยาลัยชุมชนมุกดาหาร_2ปี",
        "48_1_นวัตกรรม": "IA671004_คณะพยาบาลศาสตร์มหาวิทยาลัยขอนแก่น_1ปี",
        "49_2_ทั่วไป": "GA672133_วิทยาลัยชุมชนแพร่_2ปี",
        "50_2_ทั่วไป": "GA672144_วิทยาลัยเกษตรและเทคโนโลยีเชียงใหม่_2ปี",
        "52_2_ทั่วไป": "GA672068_มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน_2ปี",
        "52_5_ทั่วไป": "GA675069_มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน_5ปี",
        "53_2_ทั่วไป": "GA672070_วิทยาลัยเทคนิคน่าน_2ปี",
        "53_5_ทั่วไป": "GA675071_วิทยาลัยเทคนิคน่าน_5ปี",
        "54_2_ทั่วไป": "GA672072_วิทยาลัยเทคนิคชุมแพ_2ปี",
        "54_5_ทั่วไป": "GA675073_วิทยาลัยเทคนิคชุมแพ_5ปี",
        "56_1_นวัตกรรม": "IA671005_คณะพยาบาลศาสตร์มหาวิทยาลัยนราธิวาสราชนครินทร์_1ปี",
        "47_5_นวัตกรรม": "IA675067_วิทยาลัยเกษตรและเทคโนโลยีลำพูน_5ปี",
        "59_2_นวัตกรรม": "IA672078_วิทยาลัยเกษตรและเทคโนโลยีอุบลราชธานี_2ปี",
        "59_5_นวัตกรรม": "IA675079_วิทยาลัยเกษตรและเทคโนโลยีอุบลราชธานี_5ปี",
        "60_2_ทั่วไป": "GB672080_วิทยาลัยการอาชีพพุทธมณฑล_2ปี",
        "60_5_ทั่วไป": "GB675081_วิทยาลัยการอาชีพพุทธมณฑล_5ปี",
        "61_2_ทั่วไป": "GB672145_วิทยาลัยเทคนิคหัวตะพาน_2ปี",
        "62_2_ทั่วไป": "GA672082_วิทยาลัยสารพัดช่างอุดรธานี_2ปี",
        "62_5_ทั่วไป": "GA675083_วิทยาลัยสารพัดช่างอุดรธานี_5ปี",
        "63_2_ทั่วไป": "GB672146_วิทยาลัยอาชีวศึกษาสุรินทร์_2ปี",
        "65_1_ทั่วไป": "GA671006_วิทยาลัยพยาบาลศาสตร์อัครราชกุมารีราชวิทยาลัยจุฬาภรณ์_1ปี",
        "66_2_ทั่วไป": "GA672084_วิทยาลัยการอาชีพอุดรธานี_2ปี",
        "66_5_ทั่วไป": "GA675085_วิทยาลัยการอาชีพอุดรธานี_5ปี",
        "67_2_ทั่วไป": "GA672147_วิทยาลัยอาชีวศึกษาอุดรธานี_2ปี",
        "68_2_ทั่วไป": "GA672148_วิทยาลัยอาชีวศึกษาเชียงราย_2ปี",
        "69_2_นวัตกรรม": "IA672086_มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา_2ปี",
        "69_5_นวัตกรรม": "IA675087_มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา_5ปี",
        "70_1_ทั่วไป": "GA671007_คณะพยาบาลศาสตร์มหาวิทยาลัยอุบลราชธานี_1ปี",
        "71_2_ทั่วไป": "GA672149_วิทยาลัยอาชีวศึกษาปัตตานี_2ปี",
        "72_2_ทั่วไป": "GB672150_วิทยาลัยการอาชีพนครศรีธรรมราช_2ปี",
        "73_1_ทั่วไป": "GB671008_คณะทันตแพทยศาสตร์มหาวิทยาลัยเชียงใหม่_1ปี",
        "74_2_ทั่วไป": "GA672151_วิทยาลัยเกษตรและเทคโนโลยีนครราชสีมา_2ปี",
        "75_1_นวัตกรรม": "IA671009_คณะพยาบาลศาสตร์วิทยาลัยบัณฑิตเอเชีย_1ปี",
        "76_1_ทั่วไป": "GA671010_คณะพยาบาลศาสตร์มหาวิทยาลัยวงษ์ชวลิตกุล_1ปี",
        "77_2_ทั่วไป": "GA672152_วิทยาลัยอาชีวศึกษาลำปาง_2ปี",
        "78_2_ทั่วไป": "GB672088_วิทยาลัยเกษตรและเทคโนโลยีเพชรบูรณ์_2ปี",
        "78_5_ทั่วไป": "GB675089_วิทยาลัยเกษตรและเทคโนโลยีเพชรบูรณ์_5ปี",
        "79_2_ทั่วไป": "GA672090_วิทยาลัยเทคนิคปากช่อง_2ปี",
        "79_5_ทั่วไป": "GA675091_วิทยาลัยเทคนิคปากช่อง_5ปี",
        "80_2_ทั่วไป": "GA672092_วิทยาลัยเกษตรและเทคโนโลยีศรีสะเกษ_2ปี",
        "80_5_ทั่วไป": "GA675093_วิทยาลัยเกษตรและเทคโนโลยีศรีสะเกษ_5ปี",
        "81_2_ทั่วไป": "GB672094_วิทยาลัยการอาชีพบางสะพาน_2ปี",
        "82_2_ทั่วไป": "GA672153_วิทยาลัยเกษตรและเทคโนโลยีอุดรธานี_2ปี",
        "83_2_ทั่วไป": "GA672154_วิทยาลัยชุมชนแม่ฮ่องสอน_2ปี",
        "84_2_ทั่วไป": "GB672155_วิทยาลัยอาชีวศึกษาอุตรดิตถ์_2ปี",
        "85_2_ทั่วไป": "GA672156_วิทยาลัยการอาชีพหนองคาย_2ปี",
        "86_5_ทั่วไป": "GB675186_วิทยาลัยเทคโนโลยีสารสนเทศเพชรบูรณ์_5ปี",
        "87_2_ทั่วไป": "GA672157_วิทยาลัยชุมชนสตูล_2ปี",
        "88_2_ทั่วไป": "GA672096_วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม_2ปี",
        "88_5_ทั่วไป": "GA675097_วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม_5ปี",
        "89_2_ทั่วไป": "GB672158_วิทยาลัยเทคนิคน้ำพอง_2ปี",
        "90_5_ทั่วไป": "GB675099_โรงเรียนไฮเทคเทคโนโลยีตาก_5ปี",
        "92_5_ทั่วไป": "GB675101_วิทยาลัยเทคโนโลยีไฮเทคเพชรบูรณ์_5ปี",
        "93_2_ทั่วไป": "GB672159_วิทยาลัยเกษตรและเทคโนโลยีพะเยา_2ปี",
        "94_5_ทั่วไป": "GB675188_วิทยาลัยเทคโนโลยีไฮเทคสกลนคร_5ปี",
        "95_2_ทั่วไป": "GA672160_วิทยาลัยเกษตรและเทคโนโลยีตาก_2ปี",
        "96_5_ทั่วไป": "GB675189_วิทยาลัยเทคโนโลยีวิเชียรบุรี_5ปี",
        "99_2_ทั่วไป": "GA672102_วิทยาลัยสารพัดช่างศรีสะเกษ_2ปี",
        "100_2_ทั่วไป": "GA672104_วิทยาลัยเทคนิคกันทรลักษ์_2ปี",
        "100_5_ทั่วไป": "GA675105_วิทยาลัยเทคนิคกันทรลักษ์_5ปี",
        "102_2_ทั่วไป": "GA672106_วิทยาลัยชุมชนอุทัยธานี_2ปี",
        "102_5_ทั่วไป": "GA675107_วิทยาลัยชุมชนอุทัยธานี_5ปี",
        "103_2_ทั่วไป": "GB672108_วิทยาลัยเทคนิคกำแพงเพชร_2ปี",
        "103_5_ทั่วไป": "GB675109_วิทยาลัยเทคนิคกำแพงเพชร_5ปี",
        "105_2_ทั่วไป": "GB672161_วิทยาลัยเทคนิคนครขอนแก่น_2ปี",
        "106_2_นวัตกรรม": "IA672110_วิทยาลัยอาชีวศึกษาแพร่_2ปี",
        "106_5_นวัตกรรม": "IA675111_วิทยาลัยอาชีวศึกษาแพร่_5ปี",
        "107_2_ทั่วไป": "GA672112_วิทยาลัยเทคนิคอำนาจเจริญ_2ปี",
        "107_5_ทั่วไป": "GA675113_วิทยาลัยเทคนิคอำนาจเจริญ_5ปี",
        "108_5_ทั่วไป": "GB675190_วิทยาลัยเทคโนโลยีไฮเทคชัยภูมิ_5ปี",
        "109_2_ทั่วไป": "GA672114_วิทยาลัยเทคโนโลยีการเกษตรและประมงปัตตานี_2ปี",
        "109_5_ทั่วไป": "GA675115_วิทยาลัยเทคโนโลยีการเกษตรและประมงปัตตานี_5ปี",
        "110_5_นวัตกรรม": "IA675191_วิทยาลัยเทคนิคสิงห์บุรี_5ปี",
        "111_5_ทั่วไป": "GB675117_วิทยาลัยเทคโนโลยีบริหารธุรกิจเพชรบูรณ์_5ปี",
        "112_5_ทั่วไป": "GB675192_วิทยาลัยเทคโนโลยีพระนครพณิชยการ_5ปี",
        "113_1_นวัตกรรม": "IA671011_คณะพยาบาลศาสตร์แมคคอร์มิคมหาวิทยาลัยพายัพ_1ปี",
        "114_2_ทั่วไป": "GA672162_วิทยาลัยเกษตรและเทคโนโลยีร้อยเอ็ด_2ปี",
        "115_1_นวัตกรรม": "IA671012_สำนักวิชาพยาบาลศาสตร์มหาวิทยาลัยแม่ฟ้าหลวง_1ปี",
        "117_1_ทั่วไป": "GB671013_สํานักวิชาพยาบาลศาสตร์มหาวิทยาลัยวลัยลักษณ์_1ปี",
        "118_2_ทั่วไป": "GA672164_วิทยาลัยเกษตรและเทคโนโลยียโสธร_2ปี",
        "120_2_ทั่วไป": "GB672165_วิทยาลัยอาชีวศึกษาหนองคาย_2ปี",
        "121_2_ทั่วไป": "GB672166_วิทยาลัยเทคนิคอุตสาหกรรมยานยนต์_2ปี",
        "122_2_ทั่วไป": "GA672167_วิทยาลัยเทคนิคชลบุรี_2ปี",
        "123_2_ทั่วไป": "GB672168_วิทยาลัยเกษตรและเทคโนโลยีกำแพงเพชร_2ปี",
        "124_1_ทั่วไป": "GB671014_สถาบันการจัดการปัญญาภิวัฒน์_1ปี",
        "125_2_ทั่วไป": "GB672120_วิทยาลัยเทคนิคดอกคำใต้_2ปี",
        "125_5_ทั่วไป": "GB675121_วิทยาลัยเทคนิคดอกคำใต้_5ปี",
        "126_2_ทั่วไป": "GB672169_วิทยาลัยเทคนิคบึงกาฬ_2ปี",
        "127_2_ทั่วไป": "GB672170_วิทยาลัยชุมชนสระแก้ว_2ปี",
        "128_2_ทั่วไป": "GB672122_วิทยาลัยเทคนิคเขมราฐ_2ปี",
        "128_5_ทั่วไป": "GB675123_วิทยาลัยเทคนิคเขมราฐ_5ปี",
        "129_1_นวัตกรรม": "IA671015_คณะพยาบาลศาสตร์มหาวิทยาลัยนเรศวร_1ปี",
        "130_2_ทั่วไป": "GA672124_วิทยาลัยเทคนิคปัว_2ปี",
        "130_5_ทั่วไป": "GA675125_วิทยาลัยเทคนิคปัว_5ปี",
        "131_2_ทั่วไป": "GA672171_วิทยาลัยเทคนิคนราธิวาสมหาวิทยาลัยนราธิวาสราชนครินทร์_2ปี",
        "132_2_ทั่วไป": "GA672126_วิทยาลัยเกษตรและเทคโนโลยีลพบุรี_2ปี",
        "132_5_ทั่วไป": "GA675127_วิทยาลัยเกษตรและเทคโนโลยีลพบุรี_5ปี",
        "333_2_ทั่วไป": "GA672172_วิทยาลัยเทคนิคอุดรธานี_2ปี",
        "337_2_ทั่วไป": "GA672173_วิทยาลัยอาชีวศึกษาสุพรรณบุรี_2ปี",
        "338_2_ทั่วไป": "GA672174_วิทยาลัยเทคนิคถลาง_2ปี",
        "339_1_นวัตกรรม": "IA671016_วิทยาลัยพยาบาลบรมราชชนนีขอนแก่น_1ปี",
        "340_5_ทั่วไป": "GB675193_วิทยาลัยการอาชีพปากท่อ_5ปี",
        "342_1_ทั่วไป": "GA671017_คณะพยาบาลศาสตร์มหาวิทยาลัยสงขลานครินทร์วิทยาเขตปัตตานี_1ปี",
        "345_1_ทั่วไป": "GB671018_คณะพยาบาลศาสตร์มหาวิทยาลัยเชียงใหม่_1ปี",
        "346_2_ทั่วไป": "GB672175_วิทยาลัยเกษตรและเทคโนโลยีกาญจนบุรี_2ปี",
        "348_1_ทั่วไป": "GB671019_วิทยาลัยพยาบาลบรมราชชนนีเชียงใหม่_1ปี",
        "349_5_ทั่วไป": "GA675194_วิทยาลัยอาชีวศึกษาจันทร์รวี_5ปี",
        "352_2_ทั่วไป": "GB672134_วิทยาลัยเทคโนโลยีพณิชยการราชดำเนิน_2ปี",
        "354_2_ทั่วไป": "GB672177_วิทยาลัยเทคนิคพะเยา_2ปี",
        "356_2_ทั่วไป": "GB672178_วิทยาลัยอาชีวศึกษานครราชสีมา_2ปี",
        "358_2_ทั่วไป": "GA672179_วิทยาลัยเทคนิคบางแสน_2ปี",
        "359_1_ทั่วไป": "GB671020_คณะทันตแพทยศาสตร์มหาวิทยาลัยศรีนครินทรวิโรฒ_1ปี",
        "360_2_ทั่วไป": "GB672180_วิทยาลัยการอาชีพพนมทวน_2ปี",
        "361_2_ทั่วไป": "GB672181_วิทยาลัยอาชีวศึกษาเสาวภา_2ปี",
        "362_1_ทั่วไป": "GB671202_คณะพยาบาลศาสตร์มหาวิทยาลัยมหาสารคาม_1ปี",
        "364_5_ทั่วไป": "GB675200_วิทยาลัยการอาชีพศรีสะเกษ_5ปี",


    }


    const Ty = u_id + "_" + u_type + "_" + u_type2
    console.log(Ty, Names[Ty])


    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(Names[Ty] + '.pdf'));

    res.send(pdfBase64)


    // res.send(pdfBase64)



    // res.status(200).send(":")
    // res.send("<iframe width='100%' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
}

