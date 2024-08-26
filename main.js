
const oracledb = require('oracledb');
const sqlite3 = require('sqlite3').verbose();

async function main() {

    try {
        oracledb.initOracleClient({ libDir: "C:\\oraclexe\\instantclient" });
    } catch (err) {
        console.error('Failed to initialize Oracle Client', err);
        process.exit(1);
    }

    const dbamvConfig = {
        user: "dbamv",
        password: "dbamv",
        connectString: "179.131.8.25:1521/SML"
    };

    const dbapsConfig = {
        user: "DBAPS",
        password: "afaf5)fML5$YGJA",
        connectString: "192.168.1.103:1521/MVSDSV"
    };

    const db = new sqlite3.Database('sqlite.db');

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS evento_cat_integrador (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                cd_evento_cat TEXT, 
                nr_protocolo TEXT, 
                nr_recibo TEXT, 
                tp_status_cat TEXT,
                nr_recibo_exclusao TEXT
            )`);
    });

    async function checkReceipt() {
        let connection;

        try {
            connection = await oracledb.getConnection(dbamvConfig);

            const result = await connection.execute(
                `SELECT * FROM dbamv.evento_cat_recibo WHERE id = 1`, // Ajuste a condição conforme necessário
            );


            if (result.rows.length > 0) {
                var evento = {
                    cdEventoCat: result.rows[0][1],
                    nrProtocolo: result.rows[0][2],
                    nrRecibo: result.rows[0][3],
                    tpStatusCat: result.rows[0][4],
                    nrReciboExclusao: result.rows[0][5],
                    dsErro: result.rows[0][6]
                }

                if (evento.tpStatusCat === 'T') {
                    evento.dsErro = '';
                }  

                db.get("SELECT cd_evento_cat, nr_protocolo, nr_recibo, tp_status_cat, nr_recibo_exclusao FROM evento_cat_integrador ORDER BY id DESC LIMIT 1", (err, row) => {
                    if (err) {
                        console.error("Error querying SQLite:", err);
                        return;
                    }

                    if (!row || row.cd_evento_cat !== evento.cdEventoCat || row.nr_protocolo !== evento.nrProtocolo || row.nr_recibo !== evento.nrRecibo || row.tp_status_cat !== evento.tpStatusCat) {
                        db.run("INSERT INTO evento_cat_integrador (cd_evento_cat, nr_protocolo, nr_recibo, tp_status_cat,nr_recibo_exclusao) VALUES (?,?,?,?,?)", [evento.cdEventoCat,evento.nrProtocolo,evento.nrRecibo,evento.tpStatusCat,evento.nrReciboExclusao], (err) => {
                            if (err) {
                                console.error("Error inserting into SQLite:", err);
                                return;
                            }
                        });
                        updateOtherOracleDatabase(evento);
                    }
                });
            }

        } catch (err) {
            console.error("Error with Oracle DB:", err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error("Error closing Oracle connection:", err);
                }
            }
        }
    }

    async function updateOtherOracleDatabase(evento) {
        let connection;

        try {
            connection = await oracledb.getConnection(dbapsConfig);
            await connection.execute(
                `UPDATE dbaps.evento_cat SET tp_status_cat = :tp_status_cat, nr_protocolo = :nr_protocolo, nr_recibo = :nr_recibo, nr_recibo_exclusao = :nr_recibo_exclusao, ds_erro = :ds_erro WHERE CD_EVENTO_CAT = :cd_evento_cat`, // Ajuste a condição conforme necessário
                [evento.tpStatusCat, evento.nrProtocolo, evento.nrRecibo,evento.nrReciboExclusao, evento.dsErro, evento.cdEventoCat],
                { autoCommit: true }
            );
            console.log(`Evento ${evento.cdEventoCat} atualizado com status ${evento.tpStatusCat} com sucesso!`);

        } catch (err) {
            console.error("Error updating Oracle DB:", err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error("Error closing Oracle connection:", err);
                }
            }
        }
    }

    setInterval(checkReceipt, 5000); 
}

main();
console.log('Script iniciado...');