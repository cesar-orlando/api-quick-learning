const companies = [
    {
        "company": "Messier Dowty Mexico SA De Cv",
        "contact": "",
        "phone": "\n4421704956",
        "address": "AVENIDA LA NORA 131 QUERETARO QUERETARO 76220",
        "followup": "",
        "employee": "JOAQUIN MONZONIS"
    },
    {
        "company": "Alpha Hi Lex Sa De Cv",
        "contact": "",
        "phone": "442 246 9008",
        "address": "Av. Peñuelas No. 9\nFraccionamiento San Pedrito\n76148 Querétaro, Qro.\nMéxico",
        "followup": "",
        "employee": "JOAQUIN MONZONIS"
    },
    {
        "company": "AL SUPLIERS SA DE CV",
        "contact": "THEO SUAREZ",
        "phone": "(656) 6563018771",
        "address": "AV MANUELJ CLOUTHIER #621-2. ZARAGOZA. CP:32590, 32590, Ahumada, Chihuahua, México",
        "followup": "WWW.ALSUPPLIERS.COM",
        "employee": "JOAQUIN MONZONIS"
    },
    {
        "company": "Master Track S DE RL MI",
        "contact": "Geovani Arreguín",
        "phone": 6144262727,
        "address": "Republica de Bolivia, 31210, Chihuahua, Chihuahua, México",
        "followup": "www.mastertrackgps.net",
        "employee": "JOAQUIN MONZONIS"
    },
    {
        "company": "Mecal De Mexico S. De R.L De C.V",
        "contact": "",
        "phone": "",
        "address": "Av. Industrias 6504 42 Col. Nombre de Dios, 31105, Chihuahua, Chihuahua, México",
        "followup": "",
        "employee": "JOAQUIN MONZONIS"
    },
    {
        "company": "Polyshel SA de CV",
        "contact": "",
        "phone": "427 272 9232",
        "address": "Fultón No. 2 Zona Industrial Valle de Oro, Zona Industrial Valle de Oro, 76802 San Juan del Río, Querétaro",
        "followup": "",
        "employee": "ELIZABETH GODINEZ"
    },
    {
        "company": "Modern engineering and automation center, S de RL de CV\nRefacciones",
        "contact": "",
        "phone": "\t6562814921",
        "address": "Hacienda Bustillos #7960. Las Viñas. CP:32696, 32696, Juárez, Chihuahua, México",
        "followup": "",
        "employee": "ELIZABETH GODINEZ"
    },
    {
        "company": "Moetti Mobiliario y Decoración,S.A.de C.V.",
        "contact": "",
        "phone": "",
        "address": "Ortiz Mena #3128 Local 1 y 2. San Felipe I. CP:31202, 31202, Chihuahua, Chihuahua, México",
        "followup": "",
        "employee": "ELIZABETH GODINEZ"
    },
    {
        "company": "CASA TEQUILERA DINASTÍA ARANDINA, S.A. DE C.V.",
        "contact": "",
        "phone": 3338364420,
        "address": "CARRETERA A LA BASE AEREA3640 K COL.UNIDAD MILITAR C.P.45200. ZAPOPAN, JALISCO ",
        "followup": "",
        "employee": "ELIZABETH GODINEZ"
    },
    {
        "company": "CASA TRADICIÓN, S.A. DE C.V.",
        "contact": "",
        "phone": 3336931120,
        "address": "AV. AMADO NERVO2200 TORRE BIO N6 INT. 601 COL.JARDINES DEL SOL C.P.45050. ZAPOPAN, JALISCO ",
        "followup": "",
        "employee": "ELIZABETH GODINEZ"
    },
    {
        "company": "MESSIER SERVICES AMERICAS, S.A. DE C.V.",
        "contact": "",
        "phone": "\n4421925800",
        "address": "AVENIDA LA NORIA 131\nPARQUE INDUSTRIAL QUERÉTARO\nQuerétaro, QUERÉTARO\nC.P. 76220",
        "followup": "",
        "employee": "CHRISTIAN MEDINA "
    },
    {
        "company": "Electrónica Clarion, S.A. De C.V.",
        "contact": "",
        "phone": "427 271 8800",
        "address": "AVENIDA AV. 3 ESQUINA CALLE 9 S/N\n76800 San Juan Del Rio, Queretaro De Arteaga\nMéxico",
        "followup": "",
        "employee": "CHRISTIAN MEDINA "
    },
    {
        "company": "Thermotech SA De Cv",
        "contact": "https://grupothermotek.com/",
        "phone": "",
        "address": "Ignacio Pérez, Revolución, 76118 Santiago de Querétaro, Qro., Mexico",
        "followup": "",
        "employee": "CHRISTIAN MEDINA "
    },
    {
        "company": "Seaquist De Mexico SA De Cv",
        "contact": "",
        "phone": "",
        "address": "Canadá 11, El Marqués Queretano, 76047 Santiago de Querétaro, Qro., Mexico",
        "followup": "",
        "employee": "CHRISTIAN MEDINA "
    },
    {
        "company": "Ilpeasa sa de cv",
        "contact": "",
        "phone": "",
        "address": "CALLE 3 20 A INDUSTRIAL BENITO JUAREZ CALLE 1 Y CALLE 2 QUERETARO QUERETARO 76130",
        "followup": "",
        "employee": "CHRISTIAN MEDINA "
    },
    {
        "company": "TYCO VALVES AND CONTROLS DE MEXICO S.A DE C.",
        "contact": "",
        "phone": 52089068,
        "address": "CALLE 3 S/N, LOTES 13, 14 Y 15, PARQUE INDUSTRIAL EL SALTO,SALTO, EL ,JALISCO 45680",
        "followup": "",
        "employee": "RICARDO CUETO"
    },
    {
        "company": "Hidraulica Y Macanica S.A. De C.V.",
        "contact": "https://hymsa.com.mx/contacto.html",
        "phone": "8327 5580",
        "address": "Vía a Tampico Km 507+816\nCol.Valles de San Rafael Guadalupe, N.L.\nC.P. 67110",
        "followup": "",
        "employee": "RICARDO CUETO"
    },
    {
        "company": "Recubrimientos Naturales Mexicanos SA De Cv",
        "contact": "",
        "phone": "8717154506\n",
        "address": "CALZADA LAS CRUCES CALZADA VILLA JARDÍN / AVENIDA ANACONDA / CALLE MONTAÑAS NRO. 70 COLONIA NUEVA ROSITA DURANGO / LERDO / LERDO",
        "followup": "",
        "employee": "RICARDO CUETO"
    },
    {
        "company": "Nacional de Servicios Dargue, S.A. DE C.V.",
        "contact": "Francisco Gonzalez/Director General",
        "phone": "55 55 67 16 16",
        "address": "PONIENTE # 122 # 721 INDUSTRIAL VALLEJO\nAZCAPOTZALCO CDMX",
        "followup": "www.naseda.com.mx",
        "employee": "RICARDO CUETO"
    },
    {
        "company": "Minerales Y Productos Industriales SA De Cv",
        "contact": "Carlos Canales Cobo  ",
        "phone": 7192111,
        "address": "VALLE DEL GUADIANA/575//PARQUE INDUSTRIAL LAGUNERO//ACATITA DE BAJAN GOMEZ PALACIO DURANGO 35078",
        "followup": "",
        "employee": "RICARDO CUETO"
    },
    {
        "company": "NOVA INSPECTION SERVICES S DE RL DE CV",
        "contact": "Juan Manuel Rangel Rodriguez/Gerente de Operación",
        "phone": 9933366578,
        "address": "Entrada la Gloria #SN. Lazaro Cardenas 2da Sección. CP:86280",
        "followup": "",
        "employee": "ANDREA DE LOS ANGELES"
    },
    {
        "company": "Artículos Eléctricos Industriales S.A.de C.V",
        "contact": "Sofia Aguilar/Ecommerce & Marketing",
        "phone": "",
        "address": "Calle 60 diagonal #483. Parque industrial. CP:97302, 97302, Mérida, Yucatán, México",
        "followup": "",
        "employee": "ANDREA DE LOS ANGELES"
    },
    {
        "company": "Gourmet Farms Caborca, S.A. de C.V.",
        "contact": "Paul Michel Martin/Administrador",
        "phone": 6373739057,
        "address": "CALZADA 6 DE ABRIL 227 PRADOS DEL SOL Y DE LAS FLORES CABORCA SONORA 83680",
        "followup": "",
        "employee": "ANDREA DE LOS ANGELES"
    },
    {
        "company": "CECOEN SUPPLIES S DE RL DE CV",
        "contact": "",
        "phone": "(81)8363 3181",
        "address": "Av. Lázaro Cárdenas #3520, Del Paseo Residencial, Monterrey, Nuevo León, México. C.P. 64920",
        "followup": "",
        "employee": "ANDREA DE LOS ANGELES"
    },
    {
        "company": "Dispositivos Electrónicos de Protección S.A. de C.V.",
        "contact": "",
        "phone": "",
        "address": "Av. de la Convención Nte. # 713 Col. Gremial CP: 20030 Aguascalientes, Ags.\n ",
        "followup": "",
        "employee": "ANDREA DE LOS ANGELES"
    },
    {
        "company": "Montacargas Momatt S.A De C.V",
        "contact": "https://www.momatt.com/servicios.php",
        "phone": "(55) 5879 8597",
        "address": "MEXICALI (BAJA CALIFORNIA -NORTE Y SUR-, SAN LUIS Y PUERTO PEÑASCO DE SONORA) Antonio Valdez Herrera 544-1 Col. Diez división dos,, 21395, Mexicali, Baja California, México",
        "followup": "Ya tienen cuenta bajo el nombre Momatt Sa de cv",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "AGAVEROS DE LA REGION, S.A. DE C.V.",
        "contact": "",
        "phone": 3314977104,
        "address": "CAMINO A LA MANTECOSA1 COL.S/C C.P.45380. AMATITAN, JALISCO",
        "followup": "SE DA SEGUIMIENTO A LA APERTURA",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Especialized Automotive Packaging S.A. de C.V.",
        "contact": "Tracsy Cuitláhuac López De dios/Jefe de área, Marketing y Comunicación",
        "phone": "(52) 449 139 80 98",
        "address": "Ladrilleras 101, Lotes de Arellano #101. Aguascalientes. CP:20298",
        "followup": "NO PUDE HACER CONTACTO",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "AGAVES SELECTOS DE AMATITAN, S.A. DE C.V. ",
        "contact": "",
        "phone": 3332502709,
        "address": "RANCHO PASO DE PARRA1 COL.SAN JOSE DE GRACIA C.P.63940. IXTLAN DEL RIO, NAYARIT",
        "followup": "SE DA SEGUIMIENTO A LA APERTURA",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "FHR INSTALACIONES INDUSTRIALES S. DE R. L. DE C. V.",
        "contact": "Francisco de Hoyos/Gerente ",
        "phone": 8444274730,
        "address": "MESON DEL NORTE #186. VILLAS DE ARIZPE. CP:25902",
        "followup": "No manejan divisas. Es solo mercado nacional",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "La Ada De Acu&A SA De Cv",
        "contact": "",
        "phone": "",
        "address": "Carretera Presa La Amistad Km 4.5 Industrial, 26220 Ciudad Acuña, Coahuila",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Deltaplast Mexico SA De Cv",
        "contact": "",
        "phone": "871 733 2560",
        "address": "Boulevard San Pedro S/N, 27400 Torreón, Coahuila de Zaragoza",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Littelfuse Sa de Cv",
        "contact": "",
        "phone": "",
        "address": "González, 26020 Piedras Negras, Coah., Mexico",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Hrs Hardware De Mexico SA De Cv",
        "contact": "",
        "phone": "",
        "address": "CALLE BENITO JUAREZ PONIENTE 507\n25600 Frontera, Coahuila De Zaragoza",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Equipos Mineros De Monclova SA De Cv",
        "contact": "",
        "phone": "866 636 0263",
        "address": "\nAv. Industrial No. 5 Industrial, 25618 Frontera, Coahuila",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Agromayal Botanica SA De Cv",
        "contact": "",
        "phone": "",
        "address": "Avenida Juárez 3592, Cuarto de Cobian Centro, 27000 Torreón, Coah., Mexico",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Inergy Automotive Systems Mexico SA De Cv",
        "contact": "",
        "phone": "",
        "address": "25900 Ramos Arizpe, Coahuila, Mexico",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Equipos De Acuña SA De Cv",
        "contact": "",
        "phone": "877 773 0618",
        "address": "Carr. Presa La Amistad Km. 8.5 Parque Industrial La Paz, 26220 Ciudad Acuña, Coahuila",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Fabricaciones Y Maquinados Para La Industria S.A. De C.V.",
        "contact": "",
        "phone": "",
        "address": "Venustiano Carranza, 25870 Castaños, Coah., Mexico",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "INMETMATIC SA DE CV",
        "contact": "",
        "phone": "",
        "address": "Ignacio Allende, Zona Centro, 25000 Saltillo, Coah., Mexico",
        "followup": "",
        "employee": "ALONSO FLORES"
    },
    {
        "company": "Unlimited Electro Group SA de CV",
        "contact": "Felipe Pineda",
        "phone": 6643852368,
        "address": "Jose de Galvez #17003. Garita de Otay. CP:22206, 22206, Tijuana, Baja California, México",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "CASA MONTES LEYVA, S. DE R.L. DE C.V.",
        "contact": "",
        "phone": 3173814366,
        "address": "FELIPE URIBE44 D COL.CENTRO C.P.48900. AUTLAN DE NAVARRO, JALISCO ",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Siemens Vdo S.A. De C.V.",
        "contact": "https://www.siemens.com/mx/es/compania/acerca-de.html",
        "phone": " 800 560 0158",
        "address": "Calle Chimeneas 6300 (32360) Juárez",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Robert Bosch Sistemas De Frenos Sa De Cv",
        "contact": "",
        "phone": "9158412366\n",
        "address": "Hermanos Escobar 6965, Omega, 32410 Juárez, Chih., Mexico",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Grupo Tornillero San Marcos",
        "contact": "",
        "phone": " \n444 822 6759",
        "address": "Ricardo B Anaya 2201-A; Ricardo B Anaya; 78390; San Luis Potosi; San Luis Potosi ",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Brena Mex SA D Cv",
        "contact": "",
        "phone": "",
        "address": "Amistad, 26220 Ciudad Acuña, Coah., Mexico",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Wabash Transformer De Mexico SA De Cv",
        "contact": "",
        "phone": "",
        "address": "CARR 57 Y CEDRO/SIN NUM//CHAPULTEPEC//SIN REFERENCIA SABINAS COAHUILA 26790",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Assa Servicios y Manufacturación Sa de Cv",
        "contact": "",
        "phone": "869 694 3323",
        "address": "25505, Francisco I. Madero 202, 25500 San Buenaventura, Coahuila",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Caridiatools SA De Cv",
        "contact": "",
        "phone": "",
        "address": "AVENIDA RIO DE LA PLATA, 435 TORREON COAHUILA 27010",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Douglas Y Lomason De Mexico SA De Cv",
        "contact": "",
        "phone": "877 773 0458",
        "address": "Carretera Presa La Amistad Km. 5, 26220 Ciudad Acuña, Coahuila de Zaragoza",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Canteras Portofino S.A. De C.V.",
        "contact": "",
        "phone": "",
        "address": "Puerta de Hierro 28, Rincón San Angel, 27108 Torreón, Coah., Mexico",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Versatilidad Industrial De Monclova SA De Cv",
        "contact": "",
        "phone": "",
        "address": "Calle Montecarlo 903, 25720 Monclova, Coahuila de Zaragoza",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": " LOS FRAILES DE HIDALGO, S.A. DE C.V.",
        "contact": "",
        "phone": "",
        "address": "QUIMICA 340 TORREON COAHUILA 27272",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "Diken De Mexico S.A De C.V",
        "contact": "",
        "phone": "",
        "address": "Industria Aeroespacial, Coahuila de Zaragoza, Mexico",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "GREEN FILTERS SA DE CV",
        "contact": "",
        "phone": "",
        "address": "ISIDRO LOPEZ ZERTUCHE 5491 SALTILLO COAHUILA 25220",
        "followup": "",
        "employee": "DIEGO CEBALLOS"
    },
    {
        "company": "TecnoTanques",
        "contact": "Alonso Ledezma",
        "phone": "33 8525 9586",
        "address": "Avenida San Francisco 3401\n45500 Zapopan,",
        "followup": "",
        "employee": "ALINE VERONICA"
    },
    {
        "company": "Magnoberrys, S.A. de C.V.",
        "contact": "Jairo Alberto Peña",
        "phone": 3316776875,
        "address": "Goya, 88\nCol. Real Vallarta\n45020 Guadalajara,\nMéxico",
        "followup": "",
        "employee": "ALINE VERONICA"
    },
    {
        "company": "Embotelladora de Occidente ",
        "contact": "Sr. Oscar Bravo Pérez",
        "phone": "33 3678 6600",
        "address": "Mariano Otero No. 911\nCol. Del Fresno\n44909 Guadalajara, Jal.\nMéxico",
        "followup": "",
        "employee": "ALINE VERONICA"
    },
    {
        "company": "ALBA Technology & Manufacturing SA de CV",
        "contact": "Juan Manuel García Arroyo/Gerente de Ventas",
        "phone": 8445066472,
        "address": "Ébano #100. Torremolinos. CP:25903, 25903, Ramos Arizpe, Coahuila, México",
        "followup": "",
        "employee": "ALINE VERONICA"
    },
    {
        "company": "ALD Tratamientos Térmicos S.A. de C.V.",
        "contact": "Aranza Arias",
        "phone": "844 8669793",
        "address": "Ramos Arizpe, Coah. Blvd. Omega No. 2270",
        "followup": "",
        "employee": "ALINE VERONICA"
    },
    {
        "company": "Innovación Farmacéutica S.A. de C.V.",
        "contact": "Lizeth Hernández López\t/Gerente / Director general\t",
        "phone": 6643938537,
        "address": "Cerro del Cubilete #7601 Int 1, Col. Cerro Colorado, C.P. 22223, Tijuana, Baja California, Mexico",
        "followup": "",
        "employee": "CRISTIAN TESILLOS"
    },
    {
        "company": "Gape Integral Solutions SA de CV",
        "contact": "Abel Darío Galván Rodriguez/Director de Proyectos",
        "phone": 8441811014,
        "address": "San Isidro #1329 Col. La Estrella Amp C.P. 25084",
        "followup": "",
        "employee": "CRISTIAN TESILLOS"
    },
    {
        "company": "Aceros y Tuberías RV",
        "contact": "Lucia Vázquez",
        "phone": "8115016811\n\n ",
        "address": "Canzo No. 102, Col. Brianzzas Residencial, General Escobedo, C.P.66072",
        "followup": "",
        "employee": "CRISTIAN TESILLOS"
    },
    {
        "company": "HLC Metal Parts China LTD",
        "contact": "https://www.hlc-metalparts.com/contact-us",
        "phone": "844 692 0331",
        "address": "Carret a Los Pinos 1705 Isidro Lopez Rural Carr Mty Ag.",
        "followup": "",
        "employee": "CRISTIAN TESILLOS"
    },
    {
        "company": "COMPAÑÍA DESTILADORA DE XAMAY, S.A. DE C.V.",
        "contact": "https://www.destiladoraxamay.com/es/\nHome\nCompañia Destiladora de Xamay\n ",
        "phone": "333 107 3131",
        "address": "CARRETERA JAMAY LA BARCA KM 3.2SN COL.SC C.P.47900. JAMAY, JALISCO ",
        "followup": "",
        "employee": "CRISTIAN TESILLOS"
    },
    {
        "company": "FUSION AGROINDUSTRIAL, S.A. DE C.V.",
        "contact": "",
        "phone": 3312847684,
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "Comercio Agricola S.A. De C.V.",
        "contact": "Héctor Sada Quiroga  ",
        "phone": "686 561 8506",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "Cooper Tools De Mexico S. De R.L. De C.V.",
        "contact": "Hector Zago Galeazzi",
        "phone": "442 211 3800",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "Cafe Ecex 2000 S.A. De C.V.",
        "contact": "",
        "phone": "55 5615 9230",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "Dupont Mexico, S.A. De C.V.",
        "contact": "Cynthia Rios",
        "phone": "55 5722 100",
        "address": "",
        "followup": "Prospectada",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "\t\nPROVISTA SA DE CV",
        "contact": "",
        "phone": "442 277 5030",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "QUERENDA STONE SA DE CV",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "SERRA SOLDADURA DE MEXICO SA DE CV.",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "VC LAMINATIONS S.A. DE C.V.",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "Automanufacturas De Queretaro SAPI de CV",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "\t\nDUQUEINE GROUP MEXICO S.A. DE C.V.",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "EXAGRI SA DE CV",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "SERRA GLOBAL TECHNOLOGY SA DE CV",
        "contact": "",
        "phone": "427 129 4097",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "POLYSHEL SA DE CV",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    },
    {
        "company": "MECANIZADOS Y SERVICIOS INDUSTRIALES DE QUERETARO SA DE CV",
        "contact": "",
        "phone": "",
        "address": "",
        "followup": "",
        "employee": "SANTIAGO CAMPOS "
    }
];

module.exports = companies;