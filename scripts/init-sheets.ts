import { initSheets } from '../lib/sheets';
initSheets()
  .then(() =>
    console.log(
      'Pestañas y encabezados verificados. No se modificaron filas de estudiantes ni resultados.',
    ),
  )
  .catch(() => {
    console.error(
      'No se pudo inicializar la planilla. Revisá las variables de .env.local, los permisos de edición de la cuenta de servicio y los encabezados existentes.',
    );
    process.exitCode = 1;
  });
