import mysql from "mysql2";
import db from "./db_config_eef.js"

const pool = mysql.createPool(db).promise();


export default pool;