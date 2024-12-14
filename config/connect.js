import mysql from "mysql2";
import db from "./db_config.js"

const pool = mysql.createPool(db).promise();


export default pool;
