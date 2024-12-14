import PDFMerge from 'pdf-merger-js';
import axios from 'axios'
import https from 'https'
import pool from '../config/connect_eef_sp.js';
import * as Pages from './eefSp.Controller.js';
import fs from 'fs';


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
        return false
    }
}


const margePdf = async (data) => {
    try {

        const Page1 = await Pages.PDF1(data)
        const Page2 = await Pages.PDF2(data)
        const Page3 = await Pages.PDF3(data)
        const Page4 = await Pages.PDF4(data)
        const Page41 = await Pages.PDF41(data)
        const Page42 = await Pages.PDF42(data)
        const Page43 = await Pages.PDF43(data)
        const Page4Last = await Pages.PDF4last(data)
        const Page5 = await Pages.PDF5(data)
        const Page6 = await Pages.PDF6(data)
        const Page7 = await Pages.PDF7(data)
        const Page8 = await Pages.PDF8(data)
        const Page9 = await Pages.PDF9(data)
        const Page10 = await Pages.PDF10(data)
        const Page11 = await Pages.PDF11(data)
        const Page12 = await Pages.PDF12(data)
        const Page13 = await Pages.PDF13(data)
        const Page15 = await Pages.PDF15(data)
        const Page16 = await Pages.PDF16(data)

        const SortData = {
            "P1": Page1,
            "โครงสร้างการบริหารโครงการ": data['Files']["โครงสร้างการบริหารโครงการ"],
            "P2": Page2,
            "ในกรณีที่โครงการที่ได้รับทุน จาก กสศ.": data['Files']["ในกรณีที่โครงการที่ได้รับทุน จาก กสศ."],
            "P3": Page3,
            "หลักการและเหตุผล": data['Files']["หลักการและเหตุผล"],
            "P4": Page4,
            "P41": Page41,
            "ข้อมูลความขาดแคลนและความต้องการแรงงาน 1": data['Files']["ข้อมูลความขาดแคลนและความต้องการแรงงาน 1"],
            "P42": Page42,
            "ข้อมูลความขาดแคลนและความต้องการแรงงาน 2": data['Files']["ข้อมูลความขาดแคลนและความต้องการแรงงาน 2"],
            "P43": Page43,
            "ข้อมูลความขาดแคลนและความต้องการแรงงาน 3": data['Files']["ข้อมูลความขาดแคลนและความต้องการแรงงาน 3"],
            "P49": Page4Last,
            "ความพร้อมและความเชื่อมั่น ในการดำเนินโครงการให้ประสบความสำเร็จตามเป้าหมาย": data['Files']["ความพร้อมและความเชื่อมั่น ในการดำเนินโครงการให้ประสบความสำเร็จตามเป้าหมาย"],
            "P5": Page5,
            "หากสถานศึกษาของท่านไม่สามารถค้นหา คัดกรอง และคัดเลือก": data['Files']["หากสถานศึกษาของท่านไม่สามารถค้นหา คัดกรอง และคัดเลือก"],
            "สรุปแนวทางการแนะแนวและประชาสัมพันธ์": data['Files']["สรุปแนวทางการแนะแนวและประชาสัมพันธ์"],
            "P6": Page6,
            "วิธีการบริหารจัดการหาหอพักให้นักศึกษาผู้รับทุนที่ไม่สามารถจัดสรรหอพักภายใน": data['Files']["วิธีการบริหารจัดการหาหอพักให้นักศึกษาผู้รับทุนที่ไม่สามารถจัดสรรหอพักภายใน"],
            "บริหารจัดการหาหอพักให้นักศึกษาผู้รับทุน": data['Files']["บริหารจัดการหาหอพักให้นักศึกษาผู้รับทุน"],
            "P7": Page7,
            "การเตรียมความพร้อมก่อนเข้าเรียน": data['Files']["การเตรียมความพร้อมก่อนเข้าเรียน"],
            "การจัดทำแผนการจัดการศึกษาเฉพาะบุคคล": data['Files']["การจัดทำแผนการจัดการศึกษาเฉพาะบุคคล"],
            "P8": Page8,
            "การให้คำปรึกษาทางวิชาการ": data['Files']["การให้คำปรึกษาทางวิชาการ"],
            "ระบบดูแลผู้เรียนที่มีความต้องการพิเศษ": data['Files']["ระบบดูแลผู้เรียนที่มีความต้องการพิเศษ"],
            "P9": Page9,
            "การให้คำปรึกษาและพัฒนาทักษะ": data['Files']["การให้คำปรึกษาและพัฒนาทักษะ"],
            "P10": Page10,
            "กลไกการติดตามดูแลและให้แนวทางในการให้คำปรึกษา": data['Files']["กลไกการติดตามดูแลและให้แนวทางในการให้คำปรึกษา"],
            "ข้อเสนอกิจกรรมแนวทางในการดูแลความเป็นอยู่": data['Files']["ข้อเสนอกิจกรรมแนวทางในการดูแลความเป็นอยู่"],
            "แนวทางในการพัฒนาหลักสูตรและกระบวนการเรียน": data['Files']["แนวทางในการพัฒนาหลักสูตรและกระบวนการเรียน"],
            "P11": Page11,
            "แนวทางการจัดกระบวนการเรียนการสอนและการฝึกประสบการณ์": data['Files']["แนวทางการจัดกระบวนการเรียนการสอนและการฝึกประสบการณ์"],
            "ข้อเสนอกิจกรรมแนวทางในการพัฒนาหลักสูตร": data['Files']["ข้อเสนอกิจกรรมแนวทางในการพัฒนาหลักสูตร"],
            "แนวทางในการส่งเสริมโอกาสการมีงานทำ": data['Files']["แนวทางในการส่งเสริมโอกาสการมีงานทำ"],
            "ข้อเสนอกิจกรรมแนวทางในการส่งเสริมโอกาส": data['Files']["ข้อเสนอกิจกรรมแนวทางในการส่งเสริมโอกาส"],
            "สรุปกิจกรรมตามกรอบคุณภาพ": data['Files']["สรุปกิจกรรมตามกรอบคุณภาพ"],
            "P12": Page12,
            "แผนงบประมาณ": data['Files']["แผนงบประมาณ"],
            "ระบุความต่อเนื่องยั่งยืน": data['Files']["ระบุความต่อเนื่องยั่งยืน"],
            "P13": Page13,
            "P15": Page15,
            // 3-1
            "ประวัติผู้รับผิดชอบโครงการโดยย่อ": data['Files']["ประวัติผู้รับผิดชอบโครงการโดยย่อ"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 1": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 1"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 2": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 2"],
            "หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 3": data['Files']["หลักสูตรรายวิชาทุกหลักสูตรสาขาวิชา/สาขางาน 3"],
            "ข้อมูลการสำรวจจำนวนผู้เรียนที่มีความต้องการพิเศษ": data['Files']["ข้อมูลการสำรวจจำนวนผู้เรียนที่มีความต้องการพิเศษ"],
            "แผนผังและภาพของอาคารสถานที่ 1": data['Files']["แผนผังและภาพของอาคารสถานที่ 1"],
            "แผนผังและภาพของอาคารสถานที่ 2": data['Files']["แผนผังและภาพของอาคารสถานที่ 2"],
            "แผนผังและภาพของอาคารสถานที่ 3": data['Files']["แผนผังและภาพของอาคารสถานที่ 3"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 1": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 1"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 2": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 2"],
            "หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 3": data['Files']["หลักฐานที่แสดงถึงข้อมูลจำนวนนักศึกษาที่คงอยู่ 3"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 1": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 1"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 2": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 2"],
            "หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 3": data['Files']["หลักฐานที่แสดงถึงข้อมูลนักศึกษาที่มีงานทำ 3"],
            "รายงานผลสำรวจการมีงานทำ": data['Files']["รายงานผลสำรวจการมีงานทำ"],



            // 3-2
            "หลักฐานการประกันการมีงานทำ": data['Files']["หลักฐานการประกันการมีงานทำ"],
            "แผนผังจากหอพักนักศึกษาถึงสถานที่เรียน": data['Files']["แผนผังจากหอพักนักศึกษาถึงสถานที่เรียน"],
            "ภาพถ่ายหอพักนักศึกษา": data['Files']["ภาพถ่ายหอพักนักศึกษา"],
            "ประกาศอัตราการเรียกเก็บค่าเช่าหอพักและค่าสาธารณูปโภค": data['Files']["ประกาศอัตราการเรียกเก็บค่าเช่าหอพักและค่าสาธารณูปโภค"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 1": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 1"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 2": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 2"],
            "แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 3": data['Files']["แผนการเรียนและการฝึกประสบการณ์วิชาชีพในสถานประกอบการ 3"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 1": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 1"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 2": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 2"],
            "เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 3": data['Files']["เอกสารแสดงค่าธรรมเนียมการศึกษาของหลักสูตรสาขาวิชา/สาขางานที่เสนอขอตลอดหลักสูตร 3"],
            "เอกสารอื่น ๆ 1": data['Files']["เอกสารอื่น ๆ 1"],
            "เอกสารอื่น ๆ 2": data['Files']["เอกสารอื่น ๆ 2"],
            "เอกสารอื่น ๆ 3": data['Files']["เอกสารอื่น ๆ 3"],



            "P16": Page16,
            "คำรับรอง": data['Files']["คำรับรอง"],

        }


        const merger = new PDFMerge();

        for await (const i of Object.entries(SortData)) {
            if (i[0].substring(0, 1) != 'P') {
                if (i[1] != null) {
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
                    console.log(i[0])

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


export const MergeSP = async (req, res) => {
    const u_id = req.params.u_id
    const data = await getData(u_id);
    const pdfBase64 = await margePdf(data);


    const Users = data['Users']['0']
    console.log(Users.u_school)

    res.contentType("application/pdf");
    // res.contentType('Content-Disposition', 'attachment; filename=' + encodeURIComponent(Users.u_school + '.pdf'));
    res.send(pdfBase64)
}


export const MergeSPDownload = async (req, res) => {
    const u_id = req.params.u_id
    const data = await getData(u_id);
    const pdfBase64 = await margePdf(data);


    const Users = data['Users']['0']

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(Users.u_school + '.pdf'));

    res.send(pdfBase64)
}

export const MergeSp2 = async (req, res) => {
    const u_id = req.params.u_id
    const data = await getData(u_id);
    const pdfBase64 = await margePdf(data);
    const Names = {
        "8_2_ทั่วไป": "GA672022_วิทยาลัยเทคนิคตระการพืชผล_2ปี",
    }


    const Ty = u_id + "_" + u_type + "_" + u_type2
    console.log(Ty, Names[Ty])


    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(Names[Ty] + '.pdf'));

    res.send(pdfBase64)

}

