CREATE TABLE dbamv.evento_cat_recibo(
  id NUMBER(8,0),
  cd_evento_cat VARCHAR(150),
  nr_protocolo VARCHAR(150),
  nr_recibo VARCHAR(150),
  tp_status_cat VARCHAR(150)
)
GRANT SELECT,UPDATE,INSERT,DELETE ON dbamv.evento_cat_recibo TO mvintegra
/

DROP TABLE dbamv.evento_cat_recibo

INSERT INTO dbamv.evento_cat_recibo(id) VALUES(1) 

COMMIT;


