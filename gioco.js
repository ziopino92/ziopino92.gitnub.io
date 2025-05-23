let stats = {
  fede: 50,
  fedeli: 50,
  materiali: 50
};

let fazioneSelezionata = "";
let eventiCorrenti = [];

const eventi = {
  putrealismo: [
    {
      descrizione: "La Putrella sacra è danneggiata. Ripararla?",
      opzioni: [
        { testo: "Sì, immediatamente!", modifiche: { fede: +15, materiali: -10, fedeli: +5 } },
        { testo: "No, è solo simbolica", modifiche: { fede: -10, materiali: 0, fedeli: -5 } }
      ]
    },
    {
      descrizione: "Un gruppo chiede fondi per costruire un nuovo tempio.",
      opzioni: [
        { testo: "Finanziali", modifiche: { materiali: -15, fede: +10 } },
        { testo: "Rifiuta", modifiche: { fede: -5, fedeli: -5 } }
      ]
    }
  ],
  anteismo: [
    {
      descrizione: "Una nuova antenna Yagi è pronta per l’installazione.",
      opzioni: [
        { testo: "Installa subito", modifiche: { fede: +10, materiali: -10, fedeli: +5 } },
        { testo: "Non è necessaria", modifiche: { fede: -5, materiali: 0 } }
      ]
    },
    {
      descrizione: "Un blackout interferisce con la trasmissione.",
      opzioni: [
        { testo: "Investi in generatori", modifiche: { materiali: -15, fede: +5 } },
        { testo: "Aspetta che passi", modifiche: { fede: -10, fedeli: -5 } }
      ]
    }
  ],
  talppetismo: [
    {
      descrizione: "Una galleria è crollata, servono rinforzi.",
      opzioni: [
        { testo: "Invia materiali", modifiche: { materiali: -15, fedeli: +5 } },
        { testo: "Lasciali arrangiarsi", modifiche: { fede: -5, fedeli: -10 } }
      ]
    },
    {
      descrizione: "Nuove talpe vengono considerate sacre.",
      opzioni: [
        { testo: "Accoglile", modifiche: { fede: +10, fedeli: +10 } },
        { testo: "Scetticismo", modifiche: { fede: -10 } }
      ]
    }
  ]
};

function controllaSconfitta() {
  if (stats.fede <= 0 || stats.fedeli <= 0 || stats.materiali <= 0) {
    document.getElementById('descrizioneEvento').textContent = "❌ La tua fazione è crollata. Hai perso!";
    document.getElementById('scelte').innerHTML = "";
    const bottoneNuovo = document.querySelector('#evento button');
    if (bottoneNuovo) bottoneNuovo.disabled = true;
  }
}


function aggiornaStats() {
  document.getElementById('fede').textContent = stats.fede;
  document.getElementById('fedeli').textContent = stats.fedeli;
  document.getElementById('materiali').textContent = stats.materiali;
  controllaSconfitta();
}


function applicaModifiche(modifiche) {
  for (let chiave in modifiche) {
    stats[chiave] += modifiche[chiave];
  }
  document.getElementById('scelte').innerHTML = "";
  document.getElementById('descrizioneEvento').textContent = "Evento concluso. Clicca su 'Nuovo Evento' per continuare.";
  aggiornaStats();
}

function nuovoEvento() {
  const evento = eventiCorrenti[Math.floor(Math.random() * eventiCorrenti.length)];
  document.getElementById('descrizioneEvento').textContent = evento.descrizione;
  const scelteDiv = document.getElementById('scelte');
  scelteDiv.innerHTML = "";
  evento.opzioni.forEach(opzione => {
    const bottone = document.createElement('button');
    bottone.textContent = opzione.testo;
    bottone.onclick = () => applicaModifiche(opzione.modifiche);
    scelteDiv.appendChild(bottone);
  });
}

function iniziaGioco() {
  const selezione = document.getElementById('selezioneFazione').value;
  if (!selezione) {
    alert("Seleziona una fazione per iniziare.");
    return;
  }

  fazioneSelezionata = selezione;
  eventiCorrenti = eventi[fazioneSelezionata];
  stats = { fede: 50, fedeli: 50, materiali: 50 };
  aggiornaStats();

  document.getElementById('gioco').style.display = 'block';
}

