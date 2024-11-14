const nodemailer = require("nodemailer");

// Función para enviar el correo
module.exports = async function sendEmailWithExcelLink(toEmail, downloadUrl) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "jarvan235@gmail.com",
      pass: "ydba knet morq dabo",
    },
  });

  const mailOptions = {
    from: '"Equipo de Proyecto" <jarvan235@gmail.com>',
    to: toEmail,
    subject: "Entrega de Excel Corregido para Cálculo Semanal",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Entrega de Excel Corregido</h2>
        <p>Estimado/a Promotor/a,</p>

        <p>Adjunto encontrará el archivo Excel actualizado con la información de sus clientes. Le solicitamos amablemente que revise el contenido, realice las correcciones necesarias y nos lo devuelva a más tardar el día <strong>jueves</strong>.</p>

        <p>Esta entrega es importante para que podamos calcular el avance semanal de su proyecto, el cual se incluirá en el reporte para el jefe.</p>

        <p>Para descargar el archivo, haga clic en el enlace a continuación:</p>

        <p>
          <a href="${downloadUrl}" style="text-decoration: none; color: #217346; font-size: 18px; font-weight: bold;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Microsoft_Excel_2013_logo.svg" alt="Descargar Excel" style="width: 20px; height: auto; vertical-align: middle;"/> Descargar Excel
          </a>
        </p>

        <p>Le agradecemos de antemano por su colaboración y puntualidad. Si tiene alguna pregunta o necesita asistencia adicional, no dude en ponerse en contacto con nosotros.</p>

        <p>Atentamente,</p>
        <p><strong>Equipo de Proyecto</strong><br/>
        Nombre de la Empresa<br/>
        Teléfono: (123) 456-7890<br/>
        Correo electrónico: proyecto@empresa.com</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado: %s", info.messageId);
    return { success: true, message: "Correo enviado correctamente" };
  } catch (error) {
    console.error("Error al enviar el correo: ", error);
    return { success: false, message: "Error al enviar el correo" };
  }
}
