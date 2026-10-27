/**
 * The demo content in English, Spanish and French, so the translated site can be seen with real-looking texts.
 * In production these come from the back office (each record's `translations`).
 */

export const seedCatTranslations = {
  tobias: {
    en: { summary: "A calm gentleman who loves naps in the sun and a lap at the end of the day.", story: "Tobias was found in a back garden in Darque, thin but very gentle. He has recovered and is looking for a quiet home to spend his retirement in.", traits: ["calm", "gentle", "loves laps"] },
    es: { summary: "Un señor tranquilo al que le encantan las siestas al sol y el regazo al final del día.", story: "Tobias apareció en un patio de Darque, delgado pero muy cariñoso. Ya se ha recuperado y busca una casa tranquila donde pasar su jubilación.", traits: ["tranquilo", "cariñoso", "le gusta el regazo"] },
    fr: { summary: "Un monsieur calme qui adore les siestes au soleil et les câlins en fin de journée.", story: "Tobias a été trouvé dans une cour à Darque, maigre mais très doux. Il s’est remis et cherche une maison tranquille pour passer sa retraite.", traits: ["calme", "doux", "aime les genoux"] },
  },
  mia: {
    en: { summary: "A curious, playful young cat, always ready for an adventure.", story: "Mia was born in a colony by the river Lima and was spayed through our programme. She is very sociable and would be a great companion for an active family.", traits: ["playful", "curious", "sociable"] },
    es: { summary: "Una joven curiosa y juguetona, siempre lista para una aventura.", story: "Mia nació en una colonia junto al río Lima y fue esterilizada en nuestro programa. Es muy sociable y sería una compañera estupenda para una familia activa.", traits: ["juguetona", "curiosa", "sociable"] },
    fr: { summary: "Une jeune chatte curieuse et joueuse, toujours prête pour l’aventure.", story: "Mia est née dans une colonie au bord du fleuve Lima et a été stérilisée grâce à notre programme. Très sociable, elle ferait une super compagne pour une famille active.", traits: ["joueuse", "curieuse", "sociable"] },
  },
  carvao: {
    en: { summary: "A black cat who is shy at first and very affectionate once he trusts you.", story: "Carvão needs a few days to get used to new people. After that, he follows his humans all around the house. Ideal for a home without small children.", traits: ["shy", "loyal", "quiet"] },
    es: { summary: "Gato negro tímido al principio y muy cariñoso cuando coge confianza.", story: "Carvão necesita unos días para acostumbrarse a gente nueva. Después, sigue a sus dueños por toda la casa. Ideal para una casa sin niños pequeños.", traits: ["tímido", "fiel", "tranquilo"] },
    fr: { summary: "Un chat noir timide au début, très affectueux une fois en confiance.", story: "Carvão a besoin de quelques jours pour s’habituer à de nouvelles personnes. Ensuite, il suit ses humains dans toute la maison. Idéal pour un foyer sans jeunes enfants.", traits: ["timide", "fidèle", "tranquille"] },
  },
  estrela: {
    en: { summary: "A sweet cat with well-controlled diabetes; she needs insulin twice a day.", story: "Estrela is very calm and has got used to her treatment. The association teaches the family how to give insulin and helps with the first costs.", traits: ["sweet", "calm"], specialNeeds: "Diabetes controlled with insulin (twice a day)" },
    es: { summary: "Gata dulce con diabetes controlada; necesita insulina dos veces al día.", story: "Estrela es muy tranquila y se ha acostumbrado bien al tratamiento. La asociación enseña a la familia a ponerle la insulina y ayuda con los primeros gastos.", traits: ["dulce", "tranquila"], specialNeeds: "Diabetes controlada con insulina (2 veces al día)" },
    fr: { summary: "Une chatte douce au diabète équilibré ; elle a besoin d’insuline deux fois par jour.", story: "Estrela est très calme et s’est bien habituée à son traitement. L’association apprend à la famille à faire l’insuline et aide pour les premiers frais.", traits: ["douce", "calme"], specialNeeds: "Diabète équilibré par insuline (2 fois par jour)" },
  },
  pimenta: {
    en: { summary: "Recovering from surgery on her paw; she will soon be ready for adoption.", story: "Pimenta was hit by a car in Meadela and operated on at a partner clinic. She is recovering with a foster family.", traits: ["brave", "gentle"] },
    es: { summary: "Se recupera de una operación en la pata; pronto estará lista para la adopción.", story: "A Pimenta la atropellaron en Meadela y la operaron en una clínica colaboradora. Se está recuperando en una casa de acogida.", traits: ["valiente", "cariñosa"] },
    fr: { summary: "Elle se remet d’une opération à la patte ; elle sera bientôt prête à être adoptée.", story: "Pimenta a été renversée par une voiture à Meadela et opérée dans une clinique partenaire. Elle se rétablit dans une famille d’accueil.", traits: ["courageuse", "douce"] },
  },
  bolacha: {
    en: { summary: "Found in a cardboard box in Areosa, today she sleeps on the sofa.", story: "Bolacha came to us at two weeks old and was hand-reared by a foster family.", traits: ["gentle"], happyEndingText: "Bolacha sends kisses! She is the boss of the house now and wakes us up every day at seven." },
    es: { summary: "La encontraron en una caja de cartón en Areosa; hoy duerme en el sofá.", story: "Bolacha nos llegó con dos semanas de vida y la crio a mano una casa de acogida.", traits: ["cariñosa"], happyEndingText: "¡Bolacha manda besitos! Ya es la dueña de la casa y nos despierta todos los días a las siete." },
    fr: { summary: "Trouvée dans un carton à Areosa, aujourd’hui elle dort sur le canapé.", story: "Bolacha nous est arrivée à deux semaines et a été nourrie au biberon par une famille d’accueil.", traits: ["douce"], happyEndingText: "Bolacha vous fait des bisous ! C’est elle la patronne de la maison, et elle nous réveille tous les jours à sept heures." },
  },
  lua: {
    en: { summary: "A senior cat who waited two years for a family.", story: "Lua lived at the shelter for two years. She was adopted by a retired couple looking for a quiet companion.", traits: ["calm"], happyEndingText: "Lua spends her afternoons in the sun by the living-room window. It was the best decision we ever made." },
    es: { summary: "Gata sénior que esperó dos años a una familia.", story: "Lua vivió dos años en el refugio. La adoptó una pareja jubilada que buscaba una compañera tranquila.", traits: ["tranquila"], happyEndingText: "Lua pasa las tardes al sol en la ventana del salón. Fue la mejor decisión que tomamos." },
    fr: { summary: "Une chatte senior qui a attendu une famille pendant deux ans.", story: "Lua a vécu deux ans au refuge. Elle a été adoptée par un couple de retraités qui cherchait une compagne tranquille.", traits: ["calme"], happyEndingText: "Lua passe ses après-midi au soleil à la fenêtre du salon. C’est la meilleure décision que nous ayons prise." },
  },
};

export const seedPageTranslations = {
  "/": {
    en: { heading: "Help a cat who belongs to no one find someone", intro: "We rescue, treat and find families for street cats in Viana do Castelo. There are many ways to help, even without time or money." },
    es: { heading: "Ayude a un gato de nadie a ser de alguien", intro: "Rescatamos, cuidamos y buscamos familia para gatos callejeros en Viana do Castelo. Hay muchas formas de ayudar, incluso sin tiempo ni dinero." },
    fr: { heading: "Aidez un chat de personne à devenir le chat de quelqu’un", intro: "Nous sauvons, soignons et trouvons des familles pour les chats des rues à Viana do Castelo. Il y a mille façons d’aider, même sans temps ni argent." },
  },
  "/adotar": {
    en: { heading: "Adopt a cat", intro: "All our cats are vaccinated, neutered and microchipped. Take your time choosing: adoption is for life." },
    es: { heading: "Adoptar un gato", intro: "Todos nuestros gatos están vacunados, esterilizados y con microchip. Elija con calma: adoptar es para toda la vida." },
    fr: { heading: "Adopter un chat", intro: "Tous nos chats sont vaccinés, stérilisés et pucés. Prenez le temps de choisir : adopter, c’est pour la vie." },
  },
  "/ajudar": {
    en: { heading: "How can I help?", intro: "Choose whatever is easiest for you. Every way makes a difference." },
    es: { heading: "¿Cómo puedo ayudar?", intro: "Elija la forma que le resulte más fácil. Todas marcan la diferencia." },
    fr: { heading: "Comment puis-je aider ?", intro: "Choisissez ce qui vous est le plus facile. Tout compte." },
  },
  "/doar": {
    en: { heading: "Make a donation", intro: "Donations pay for the food, vaccines, neutering and vet care of the cats at the shelter. Any amount helps." },
    es: { heading: "Hacer un donativo", intro: "Los donativos pagan la comida, las vacunas, las esterilizaciones y el veterinario de los gatos del refugio. Cualquier cantidad ayuda." },
    fr: { heading: "Faire un don", intro: "Les dons paient la nourriture, les vaccins, les stérilisations et le vétérinaire des chats du refuge. Chaque euro compte." },
  },
  "/ajudar/turnos": {
    en: { heading: "Choose your volunteer shift", intro: "See the days we need help and book your place. No experience needed." },
    es: { heading: "Elija su turno de voluntariado", intro: "Vea los días en que necesitamos ayuda y reserve su plaza. No hace falta experiencia." },
    fr: { heading: "Choisissez votre créneau de bénévolat", intro: "Voyez les jours où nous avons besoin d’aide et réservez votre place. Aucune expérience nécessaire." },
  },
  "/sos": {
    en: { heading: "I found a cat. What do I do?", intro: "Emergency kit: answer one question at a time and see what to do, step by step." },
    es: { heading: "He encontrado un gato. ¿Qué hago?", intro: "Kit de emergencia: responda a una pregunta cada vez y vea qué hacer, paso a paso." },
    fr: { heading: "J’ai trouvé un chat. Que faire ?", intro: "Kit d’urgence : répondez à une question à la fois et découvrez quoi faire, étape par étape." },
  },
  "/noticias": {
    en: { heading: "News", intro: "Urgent appeals, events and news from the association." },
    es: { heading: "Noticias", intro: "Peticiones urgentes, eventos y novedades de la asociación." },
    fr: { heading: "Actualités", intro: "Appels urgents, événements et nouvelles de l’association." },
  },
  "/finais-felizes": {
    en: { heading: "Happy endings", intro: "Cats who found a family. Thank you to everyone who adopted them." },
    es: { heading: "Finales felices", intro: "Gatos que encontraron familia. Gracias a todos los que los adoptaron." },
    fr: { heading: "Belles histoires", intro: "Des chats qui ont trouvé une famille. Merci à tous ceux qui les ont adoptés." },
  },
  "/adotar/perguntas": {
    en: { heading: "Questions about adopting", intro: "The questions we hear most before an adoption. If yours isn’t here, get in touch." },
    es: { heading: "Preguntas sobre adoptar", intro: "Las dudas que más nos llegan antes de una adopción. Si la suya no está aquí, escríbanos." },
    fr: { heading: "Questions sur l’adoption", intro: "Les questions qu’on nous pose le plus avant une adoption. Si la vôtre n’y est pas, écrivez-nous." },
  },
  "/adotar/descobrir": {
    en: { heading: "Find the right cat for you", intro: "Answer a few simple questions and we’ll show you the cats that suit your home." },
    es: { heading: "Descubra el gato adecuado para usted", intro: "Responda a unas preguntas sencillas y le mostraremos los gatos que encajan con su casa." },
    fr: { heading: "Trouvez le chat qu’il vous faut", intro: "Répondez à quelques questions simples et nous vous montrerons les chats faits pour votre maison." },
  },
  "/loja": {
    en: { heading: "Charity shop", intro: "T-shirts, mugs, calendars and handmade pieces, waiting for you in our shop. Everything the shop raises pays for food, vaccines and treatment for the cats." },
    es: { heading: "Tienda solidaria", intro: "Camisetas, tazas, calendarios y piezas hechas a mano te esperan en nuestra tienda. Todo lo que recauda la tienda paga comida, vacunas y tratamientos para los gatos." },
    fr: { heading: "Boutique solidaire", intro: "T-shirts, mugs, calendriers et pièces faites main vous attendent dans notre boutique. Tout ce que la boutique rapporte paie nourriture, vaccins et soins des chats." },
  },
  "/parceiros": {
    en: { heading: "Partners", intro: "Local businesses in Viana do Castelo that support the cats and offer perks to those who help the association." },
    es: { heading: "Colaboradores", intro: "Negocios de Viana do Castelo que apoyan a los gatos y ofrecen ventajas a quien ayuda a la asociación." },
    fr: { heading: "Partenaires", intro: "Des commerces de Viana do Castelo qui soutiennent les chats et offrent des avantages à ceux qui aident l’association." },
  },
  "/patinhas": {
    en: { heading: "Patinhas: every bit of help counts", intro: "Earn Patinhas (little paws) every time you help the cats. Going up a level brings perks at our partners and a special thank you from the association." },
    es: { heading: "Patinhas: cada ayuda cuenta", intro: "Gane Patinhas (patitas) cada vez que ayuda a los gatos. Subir de nivel da ventajas en los colaboradores y un gracias especial de la asociación." },
    fr: { heading: "Patinhas : chaque geste compte", intro: "Gagnez des Patinhas (petites pattes) chaque fois que vous aidez les chats. Monter de niveau donne des avantages chez nos partenaires et un merci spécial de l’association." },
  },
  "/sobre": {
    en: { heading: "Who we are", intro: "We are a non-profit association from Viana do Castelo, set up in 2014 by volunteers who were caring for street cats." },
    es: { heading: "Quiénes somos", intro: "Somos una asociación sin ánimo de lucro de Viana do Castelo, creada en 2014 por voluntarios que cuidaban de gatos callejeros." },
    fr: { heading: "Qui sommes-nous", intro: "Nous sommes une association à but non lucratif de Viana do Castelo, créée en 2014 par des bénévoles qui s’occupaient de chats des rues." },
  },
};

export const seedPostTranslations = {
  "precisamos-de-areia-e-racao": {
    en: { title: "We need cat litter and wet food for kittens", summary: "Winter is coming and the shelter has 140 cats. You can drop off donations at the shelter on Saturday mornings.", body: "We are running low on litter and wet food for kittens. You can drop off donations at the shelter in Santa Marta de Portuzelo on Saturdays, from 10 am to 12 noon. Thank you, everyone!", ctaLabel: "Other ways to help" },
    es: { title: "Necesitamos arena y comida húmeda para gatitos", summary: "Se acerca el invierno y el refugio tiene 140 gatos. Puede dejar donativos en el refugio los sábados por la mañana.", body: "Nos queda poca arena y comida húmeda para gatitos. Puede dejar los donativos en el refugio de Santa Marta de Portuzelo los sábados, de 10 a 12 h. ¡Gracias a todos!", ctaLabel: "Otras formas de ayudar" },
    fr: { title: "Nous avons besoin de litière et de pâtée pour chatons", summary: "L’hiver arrive et le refuge compte 140 chats. Vous pouvez déposer vos dons au refuge le samedi matin.", body: "Il nous reste peu de litière et de pâtée pour chatons. Vous pouvez déposer vos dons au refuge de Santa Marta de Portuzelo le samedi, de 10 h à 12 h. Merci à tous !", ctaLabel: "Autres façons d’aider" },
  },
  "open-day-novembro": {
    en: { title: "Open Day at the shelter: come and meet our cats", summary: "Guided tours, a charity stall and lots of cats waiting for a family.", body: "We are opening the shelter’s doors so you can see our work and meet the cats looking for a family. There will be guided tours every half hour and our charity shop." },
    es: { title: "Jornada de puertas abiertas en el refugio: venga a conocer a nuestros gatos", summary: "Visitas guiadas, puesto solidario y muchos gatos esperando familia.", body: "Abrimos las puertas del refugio para que conozca nuestro trabajo y a los gatos que buscan familia. Habrá visitas guiadas cada media hora y nuestra tienda solidaria." },
    fr: { title: "Portes ouvertes au refuge : venez rencontrer nos chats", summary: "Visites guidées, stand solidaire et beaucoup de chats qui attendent une famille.", body: "Nous ouvrons les portes du refuge pour vous faire découvrir notre travail et les chats qui cherchent une famille. Visites guidées toutes les demi-heures et notre boutique solidaire." },
  },
  "campanha-esterilizacao-outubro": {
    en: { title: "Neutering campaign: 18 street cats already operated on", summary: "Thanks to your donations, we neutered 18 cats from the Meadela colony this month. 12 to go to reach our goal.", body: "Neutering is the most effective way to keep street colonies under control. Each operation costs about 35 euros. Help us reach 30.", ctaLabel: "Donate to the campaign" },
    es: { title: "Campaña de esterilización: ya hemos operado a 18 gatos callejeros", summary: "Gracias a sus donativos, este mes hemos esterilizado a 18 gatos de la colonia de Meadela. Faltan 12 para la meta.", body: "La esterilización es la forma más eficaz de controlar las colonias callejeras. Cada esterilización cuesta unos 35 euros. Ayúdenos a llegar a 30.", ctaLabel: "Donar a la campaña" },
    fr: { title: "Campagne de stérilisation : déjà 18 chats des rues opérés", summary: "Grâce à vos dons, nous avons stérilisé 18 chats de la colonie de Meadela ce mois-ci. Plus que 12 pour atteindre l’objectif.", body: "La stérilisation est le moyen le plus efficace de maîtriser les colonies de rue. Chaque stérilisation coûte environ 35 euros. Aidez-nous à arriver à 30.", ctaLabel: "Donner pour la campagne" },
  },
};

export const seedPartnerTranslations = {
  "clinica-veterinaria-exemplo": {
    en: { why: "We do the neutering for the TNR programme at a charity price." },
    es: { why: "Hacemos las esterilizaciones del programa CER a precio solidario." },
    fr: { why: "Nous faisons les stérilisations du programme de capture-stérilisation à prix solidaire." },
  },
  "loja-animais-exemplo": {
    en: { why: "Every bag of food sold with the code GN helps the shelter." },
    es: { why: "Cada saco de pienso vendido con el código GN ayuda al refugio." },
    fr: { why: "Chaque sac de croquettes vendu avec le code GN aide le refuge." },
  },
  "cafe-exemplo": {
    en: { why: "We have a charity collection box on the counter." },
    es: { why: "Tenemos una hucha solidaria en la barra." },
    fr: { why: "Nous avons une tirelire solidaire sur le comptoir." },
  },
};

export const seedProductTranslations = {
  "art-tshirt": {
    en: { name: "Gatos de Ninguém T-shirt", description: "Black cotton T-shirt with the cat from our logo. Unisex fit." },
    es: { name: "Camiseta Gatos de Ninguém", description: "Camiseta negra de algodón con el gato del logotipo. Corte unisex." },
    fr: { name: "T-shirt Gatos de Ninguém", description: "T-shirt noir en coton avec le chat du logo. Coupe unisexe." },
  },
  "art-caneca": {
    en: { name: "Winking cat mug", description: "White 330 ml mug with the cat from our logo. Dishwasher safe." },
    es: { name: "Taza del gato que guiña el ojo", description: "Taza blanca de 330 ml con el gato del logotipo. Apta para lavavajillas." },
    fr: { name: "Mug du chat qui fait un clin d’œil", description: "Mug blanc de 330 ml avec le chat du logo. Va au lave-vaisselle." },
  },
  "art-calendario": {
    en: { name: "2027 calendar of the shelter cats", description: "Twelve months, twelve cats from the shelter, photographed by the volunteers. For hanging on the wall." },
    es: { name: "Calendario 2027 de los gatos del refugio", description: "Doce meses, doce gatos del refugio, fotografiados por los voluntarios. Para colgar en la pared." },
    fr: { name: "Calendrier 2027 des chats du refuge", description: "Douze mois, douze chats du refuge, photographiés par les bénévoles. À accrocher au mur." },
  },
  "art-saco": {
    en: { name: "“Adopt, don’t shop” tote bag", description: "Strong unbleached cotton bag for everyday shopping." },
    es: { name: "Bolsa de tela «Adopta, no compres»", description: "Bolsa de algodón crudo, resistente, para las compras del día a día." },
    fr: { name: "Tote bag « Adoptez, n’achetez pas »", description: "Sac en coton écru, solide, pour les courses de tous les jours." },
  },
  "art-crochet": {
    en: { name: "Crochet kitten", description: "Handmade by a volunteer. Each one is different. About 15 cm." },
    es: { name: "Gatito de ganchillo", description: "Hecho a mano por una voluntaria. Cada uno es diferente. Unos 15 cm." },
    fr: { name: "Chaton au crochet", description: "Fait main par une bénévole. Chacun est unique. Environ 15 cm." },
  },
  "art-livro": {
    en: { name: "Book of short stories (second-hand)", description: "Short stories in Portuguese, in good condition. Given by a friend of the association." },
    es: { name: "Libro de cuentos (usado)", description: "Libro de cuentos en portugués, en buen estado. Donado por una amiga de la asociación." },
    fr: { name: "Recueil de contes (d’occasion)", description: "Contes en portugais, en bon état. Offert par une amie de l’association." },
  },
  "art-porta-chaves": {
    en: { name: "Cat keyring", description: "Acrylic keyring with the cat from our logo." },
    es: { name: "Llavero gato", description: "Llavero de acrílico con el gato del logotipo." },
    fr: { name: "Porte-clés chat", description: "Porte-clés en acrylique avec le chat du logo." },
  },
};
