let chart;

document.addEventListener("change", update);

update();

function update() {
  if (chart) chart.destroy();

  const startkapital = Number(document.querySelector("#startkapital").value);
  const kaufpreis = Number(document.querySelector("#kaufpreis").value);
  const kaufnebenkosten = Number(document.querySelector("#kaufnebenkosten").value);
  const wertentwicklung = Number(document.querySelector("#wertentwicklung").value);
  const instandhaltungskostenRate = Number(document.querySelector("#instandhaltungskosten").value);
  const tilgungsrate = Number(document.querySelector("#tilgungsrate").value);
  const kreditzins = Number(document.querySelector("#kreditzins").value);
  const mietrendite = Number(document.querySelector("#mietrendite").value);
  const anlagezins = Number(document.querySelector("#anlagezins").value);

  const zeitraum = 50;
  const darlehen = (1 + kaufnebenkosten / 100) * kaufpreis - startkapital;
  const wertentwicklungFaktorMonat = wertentwicklung / 100 / 12 + 1;
  const kapitalertragssteuer = 0.26375;
  const steuerfreibetrag = 1000;

  const bankRate = Math.round((tilgungsrate / 100 / 12) * darlehen + (kreditzins / 100 / 12) * darlehen);
  const vermoegensentwicklungKaufus = [];
  const vermoegensentwicklungMietus = [];

  let meldungSchuldenfrei;

  let kontoSchulden = darlehen;
  let kontoZinszahlungen = 0;
  let kontoGeldanlageEinzahlungenKaufus = 0;
  let kontoGeldanlageEinzahlungenMietus = startkapital;
  let kontoGeldanlageRenditeKaufus = 0;
  let kontoGeldanlageRenditeMietus = 0;
  let kontoMietzahlungen = 0;
  let kontoInstandhaltung = 0;
  let kontoKapitalertragsteuerKaufus = 0;
  let kontoKapitalertragsteuerMietus = 0;
  let kontoKapitalertragsteuerFreibetragKaufus = 0;
  let kontoKapitalertragsteuerFreibetragMietus = 0;
  let jahresfreibetragVerbleibendKaufus = 0;
  let jahresfreibetragVerbleibendMietus = 0;
  let wertImmobilie = kaufpreis;
  let vermoegenKaufus = startkapital;
  let vermoegenMietus = startkapital;
  let miete = ((mietrendite / 100) * kaufpreis) / 12;
  let instandhaltungskosten = (instandhaltungskostenRate / 100 / 12) * wertImmobilie;

  let detailsHTML = `<p>Sowohl Familie Kaufus als auch Familie Mietus verfügen beide über ein Guthaben von jeweils ${prettifyNumber(
    startkapital
  )}&nbsp;€.</p><p>Familie Kaufus kauft nun eine Immobilie im Wert von ${prettifyNumber(
    kaufpreis
  )}&nbsp;€. Zusätzlich müssen sie noch Kaufnebenkosten in Höhe von ${prettifyNumber(
    kaufpreis * (kaufnebenkosten / 100)
  )}&nbsp;€ bezahlen. Abzüglich des Eigenkapitals müssen sie daher ein Darlehen in Höhe von ${prettifyNumber(
    kontoSchulden
  )}&nbsp;€ aufnehmen. Ihre Bank gewährt ihnen das Darlehen mit einem effektiven Zinssatz von ${prettifyNumber(
    kreditzins,
    2
  )} % und einer anfänglichen Tilgungsrate von ${prettifyNumber(
    tilgungsrate,
    2
  )} %.</p><p>Familie Mietus hingegen hat einen Mietvertrag für eine identische Immobilie abgeschlossen. Ihre Jahreskaltmiete beträgt ${prettifyNumber(
    mietrendite,
    2
  )} % des Immobilienwertes. Ihr Startkapital legen sie in eine Geldanlage mit einer Jahresrendite von ${prettifyNumber(
    anlagezins,
    2
  )} % an.</p><p>Bei gleichem Einkommen und unterschiedlich hohen monatlichen Fixkosten hat entweder Familie Kaufus mehr Geld am Ende des Monats übrig (häufig ist das erst der Fall, wenn das Darlehen zurückgezahlt wurde), oder aber Familie Mietus. Diesen Überschuss legt die jeweilige Familie dann ebenfalls mit einer Rendite von ${prettifyNumber(
    anlagezins,
    2
  )} % an. Fallen diese Renditen an, werden sie von beiden Familien direkt wieder angelegt.</p>`;

  detailsHTML += `</p>`;

  for (let monat = 1; monat <= zeitraum * 12; monat++) {
    // Das bezahlt Familie Kaufus diesen Monat an Zinsen
    const zinszahlung = kontoSchulden * (kreditzins / 100 / 12);
    kontoZinszahlungen += zinszahlung;

    // Das tilgt Familie Kaufus diesen Monat
    const tilgung = Math.min(bankRate - zinszahlung, kontoSchulden);
    kontoSchulden -= tilgung;

    // Das bezahlt Familie Kaufus diesen Monat an Instandhaltungskosten
    instandhaltungskosten = (instandhaltungskostenRate / 100 / 12) * wertImmobilie;
    kontoInstandhaltung += instandhaltungskosten;

    // Das zahlt Familie Mietus diesen Monat an Miete
    miete = ((mietrendite / 100) * wertImmobilie) / 12;
    kontoMietzahlungen += miete;

    // Entweder Familie Kaufus oder Familie Mietus haben diesen Monat mehr Geld zur Verfügung.
    // Dieses Geld wird direkt in die Geldanlage investiert.
    const monatlicheKostenKaufus = zinszahlung + tilgung + instandhaltungskosten;
    const monatlicheKostenMietus = miete;
    const monatlicheKostenMax = Math.max(monatlicheKostenKaufus, monatlicheKostenMietus);
    kontoGeldanlageEinzahlungenMietus += monatlicheKostenMax - monatlicheKostenMietus;
    kontoGeldanlageEinzahlungenKaufus += monatlicheKostenMax - monatlicheKostenKaufus;

    // Bei beiden Familien wird zusätzlich jegliche Rendite, die aus der Geldanlage stammt, reinvestiert.
    // Dieses Geld wird auf einem Extra-Konto geführt, damit man in der Auswertung die Rendite berechnen kann.
    // Weiterhin fällt auf die Reinvestition noch eine Steuer an, sofern der Jahresfreibetrag überschritten ist.
    if (monat % 12 === 0) {
      // Neues Jahr - neuer Freibetrag
      jahresfreibetragVerbleibendKaufus = steuerfreibetrag;
      jahresfreibetragVerbleibendMietus = steuerfreibetrag;
    }
    const renditeKaufusBrutto =
      (kontoGeldanlageRenditeKaufus + kontoGeldanlageEinzahlungenKaufus) * (anlagezins / 100 / 12);
    const renditeMietusBrutto =
      (kontoGeldanlageRenditeMietus + kontoGeldanlageEinzahlungenMietus) * (anlagezins / 100 / 12);
    const zuVersteuerndeRenditeKaufus = Math.max(renditeKaufusBrutto - jahresfreibetragVerbleibendKaufus, 0);
    const zuVersteuerndeRenditeMietus = Math.max(renditeMietusBrutto - jahresfreibetragVerbleibendMietus, 0);
    const genutzterFreibetragKaufus = renditeKaufusBrutto - zuVersteuerndeRenditeKaufus;
    const genutzterFreibetragMietus = renditeMietusBrutto - zuVersteuerndeRenditeMietus;
    jahresfreibetragVerbleibendKaufus -= genutzterFreibetragKaufus;
    jahresfreibetragVerbleibendMietus -= genutzterFreibetragMietus;
    const zuZahlendeSteuerKaufus = zuVersteuerndeRenditeKaufus * kapitalertragssteuer;
    const zuZahlendeSteuerMietus = zuVersteuerndeRenditeMietus * kapitalertragssteuer;
    kontoKapitalertragsteuerFreibetragKaufus += genutzterFreibetragKaufus;
    kontoKapitalertragsteuerFreibetragMietus += genutzterFreibetragMietus;
    kontoKapitalertragsteuerKaufus += zuZahlendeSteuerKaufus;
    kontoKapitalertragsteuerMietus += zuZahlendeSteuerMietus;
    kontoGeldanlageRenditeKaufus += renditeKaufusBrutto - zuZahlendeSteuerKaufus;
    kontoGeldanlageRenditeMietus += renditeMietusBrutto - zuZahlendeSteuerMietus;

    // Am Ende des Betrachtungszeitraums werden die Geldanlagen aufgelöst und auf die Gewinne fallen Steuern an.
    if (zeitraum * 12 === monat) {
      kontoGeldanlageRenditeKaufus *= 1 - kapitalertragssteuer;
      kontoGeldanlageRenditeMietus *= 1 - kapitalertragssteuer;
    }

    // Berechnung der Vermögen
    vermoegenKaufus = wertImmobilie + kontoGeldanlageEinzahlungenKaufus + kontoGeldanlageRenditeKaufus - kontoSchulden;
    vermoegenMietus = kontoGeldanlageEinzahlungenMietus + kontoGeldanlageRenditeMietus;

    // Neuer Immobilienwert (für nächsten Monat)
    wertImmobilie *= wertentwicklungFaktorMonat;

    if (monat % 12 === 0) {
      vermoegensentwicklungKaufus.push(vermoegenKaufus);
      vermoegensentwicklungMietus.push(vermoegenMietus);
    }

    if (monat === 1) {
      detailsHTML += `<h2>Zwischenstand nach einem Monat</h2><p>Im ersten Monat kamen beide Familien ihren Verpflichtungen nach.</p><p>Familie Kaufus hat ${prettifyNumber(
        zinszahlung + tilgung
      )}&nbsp;€ an ihre Bank überwiesen. Darin enthalten ist eine Tilgung von ${prettifyNumber(
        tilgung
      )}&nbsp;€ (${prettifyNumber(
        (100 * tilgung) / (zinszahlung + tilgung)
      )} %) und eine Zinszahlung von ${prettifyNumber(zinszahlung)}&nbsp;€ (${prettifyNumber(
        (100 * zinszahlung) / (zinszahlung + tilgung)
      )} %). Weiterhin mussten sie über den Monat Ihre Immobilie mit ${prettifyNumber(
        instandhaltungskosten
      )}&nbsp;€ instand halten.</p><p>Familie Mietus hingegen hat ihrem Vermieter eine Kaltmiete von ${prettifyNumber(
        miete
      )}&nbsp;€ gezahlt.</p>`;
      if (monatlicheKostenKaufus > monatlicheKostenMietus) {
        detailsHTML += `<p>Familie Mietus hatte diesen Monat also ${prettifyNumber(
          monatlicheKostenMax - monatlicheKostenMietus
        )}&nbsp;€ mehr übrig als Familie Kaufus. Diesen Überschuss legen sie in ihre Geldanlage an.</p>`;
      } else if (monatlicheKostenKaufus < monatlicheKostenMietus) {
        detailsHTML += `<p>Familie Kaufus hatte diesen Monat also ${prettifyNumber(
          monatlicheKostenMax - monatlicheKostenKaufus
        )}&nbsp;€ mehr übrig als Familie Kaufus. Diesen Überschuss legen sie in ihre Geldanlage an.</p>`;
      }
    }

    if (monat === 12) {
      detailsHTML += `<h2>Zwischenstand nach einem Jahr</h2>`;
      if (wertentwicklungFaktorMonat > 1) {
        detailsHTML += `<p>Der Wert der Immobilie hat sich inzwischen auf ${prettifyNumber(
          wertImmobilie
        )}&nbsp;€ gesteigert (+${prettifyNumber(
          (100 * (wertImmobilie - kaufpreis)) / kaufpreis,
          2
        )} %). Das hat Folge, dass Familie Kaufus monatlich nun ${prettifyNumber(
          instandhaltungskosten
        )}&nbsp;€ aufbringen muss, um die Immobilie instand zu halten. Familie Mietus hingegen muss nun monatlich ${prettifyNumber(
          miete
        )}&nbsp;€ an Kaltmiete bezahlen.</p>`;
      } else if (wertentwicklungFaktorMonat < 1) {
        detailsHTML += `<p>Der Wert der Immobilie ist inzwischen auf ${prettifyNumber(
          wertImmobilie
        )}&nbsp;€ gefallen (-${prettifyNumber(
          (100 * (kaufpreis - wertImmobilie)) / kaufpreis,
          2
        )} %). Das hat Folge, dass Familie Kaufus monatlich nun ${prettifyNumber(
          instandhaltungskosten
        )}&nbsp;€ aufbringen muss, um die Immobilie instand zu halten. Familie Mietus hingegen muss nun monatlich ${prettifyNumber(
          miete
        )}&nbsp;€ an Kaltmiete bezahlen.</p>`;
      } else {
        detailsHTML += `<p>Der Wert der Immobilie ist konstant geblieben. Daher haben sich weder die Instandhaltungskosten für Familie Kaufus, noch die Kaltmiete für Familie Mietus geändert.</p>`;
      }
      detailsHTML += `<p>Das Vermögen der Familie Kaufus beträgt (abzüglich des noch offenen Darlehensbetrages von ${prettifyNumber(
        kontoSchulden
      )}&nbsp;€) jetzt ${prettifyNumber(vermoegenKaufus)}&nbsp;€. Bisher konnten sie ${
        kontoGeldanlageEinzahlungenKaufus > 0
          ? prettifyNumber(kontoGeldanlageEinzahlungenKaufus + kontoGeldanlageRenditeKaufus) + "&nbsp;€"
          : "noch nichts"
      } in ihre Geldanlage investieren.</p><p>Familie Mietus hingegen konnte mit ihrer Geldanlage inzwischen ein Vermögen von ${prettifyNumber(
        kontoGeldanlageEinzahlungenMietus + kontoGeldanlageRenditeMietus
      )}&nbsp;€ aufbauen. Sie mussten ${prettifyNumber(
        kontoKapitalertragsteuerMietus
      )}&nbsp;€ Kapitalertragsteuer bezahlen.</p><p>Grundsätzlich müssen beide Familien eine Kapitalertragsteuer von ${prettifyNumber(
        kapitalertragssteuer * 100,
        2
      )}&nbsp;% (Solidaritätszuschlag mit inbegriffen) auf die Rendite ihrer Geldanlage bezahlen. Die ersten ${prettifyNumber(
        steuerfreibetrag
      )}&nbsp;€ im Jahr sind jedoch steuerfrei.</p><h2>Vermögensentwicklung über die Jahre</h2><canvas id="myChart"></canvas>`;
    }

    if (!meldungSchuldenfrei && kontoSchulden < 1) {
      meldungSchuldenfrei = `<p>Nach ${prettifyNumber(
        monat / 12,
        1
      )} Jahren hat Familie Kaufus das Darlehen vollständig zurückgezahlt. Von nun an müssen sie nur noch die Instandhaltungskosten der Immobilie tragen und können mehr Geld in ihre Geldanlage investieren.</p>`;
    }
  }

  if (meldungSchuldenfrei) {
    detailsHTML += meldungSchuldenfrei;
  } else {
    detailsHTML += `<p>Über den gesamten Zeitzeit hat Familie Kaufus es nicht geschafft, das Darlehen vollständig zurückzuzahlen. Nach 50 Jahren ist noch ein Betrag von ${prettifyNumber(
      kontoSchulden
    )}&nbsp;€ offen.</p>`;
  }

  detailsHTML += `<h2>Ergebnis nach 50 Jahren</h2><p>Beide Familien sind mit ${prettifyNumber(
    startkapital
  )}&nbsp;€ gestartet. Um beide Szenanieren am Ende des Betrachtungszeitraumes wieder sinnvoll miteinander vergleichen zu können, verkaufen beide Familien ihr Hab und Gut und machen einen Kassensturz:</p>`;

  detailsHTML += `<p>Familie Kaufus:</p><ul><li>(Steuerfreier) Immobilienverkauf ${prettifyNumber(
    wertImmobilie
  )}&nbsp;€ (${prettifyNumber(
    ((wertImmobilie - kaufpreis) / kaufpreis) * 100
  )} % Wertsteigerung)</li><li>Auflösung Geldanlage ${prettifyNumber(
    kontoGeldanlageEinzahlungenKaufus + kontoGeldanlageRenditeKaufus / (1 - kapitalertragssteuer)
  )}&nbsp;€ (${prettifyNumber(
    (100 * kontoGeldanlageRenditeKaufus) / (1 - kapitalertragssteuer) / kontoGeldanlageEinzahlungenKaufus
  )} % Rendite)</li><li>abzgl. ${prettifyNumber(
    (kontoGeldanlageRenditeKaufus / (1 - kapitalertragssteuer)) * kapitalertragssteuer
  )}&nbsp;€ Kapitalertragsteuer</li>${
    kontoSchulden > 0
      ? `<li>abzgl. Restschuld ${prettifyNumber(
          kontoSchulden
        )}&nbsp;€</li><li>abzgl. Vorfälligkeitsentschädigung (noch nicht im Kalkulator berücksichtigt!)</li>`
      : ``
  }<li><strong>Guthaben: ${prettifyNumber(
    vermoegenKaufus
  )}&nbsp;€</strong></li></ul><p>Familie Mietus:</p><ul><li>Auflösung Geldanlage ${prettifyNumber(
    kontoGeldanlageEinzahlungenMietus + kontoGeldanlageRenditeMietus / (1 - kapitalertragssteuer)
  )} € (${prettifyNumber(
    (100 * kontoGeldanlageRenditeMietus) / (1 - kapitalertragssteuer) / kontoGeldanlageEinzahlungenMietus
  )} % Rendite)</li><li>abzgl. ${prettifyNumber(
    (kontoGeldanlageRenditeMietus / (1 - kapitalertragssteuer)) * kapitalertragssteuer
  )}&nbsp;€ Kapitalertragsteuer</li><li><strong>Guthaben: ${prettifyNumber(
    vermoegenMietus
  )}&nbsp;€</strong></li></ul>`;

  const resultKaufus = Math.round((10 * vermoegenKaufus) / vermoegenMietus) / 10;
  const resultMietus = Math.round((10 * vermoegenMietus) / vermoegenKaufus) / 10;
  if (resultKaufus > resultMietus) {
    detailsHTML += `<p style="border:1px solid black;padding: 0.5em;background-color:#e5f0f7;"><strong>Familie Kaufus konnte im gleichen Zeitraum bei gleichen Startbedingungen also ${prettifyNumber(
      resultKaufus,
      1
    )}-mal so viel Vermögen aufbauen wie Familie Mietus.</strong></p>`;
  } else if (resultKaufus < resultMietus) {
    detailsHTML += `<p style="border:1px solid black;padding: 0.5em;background-color:#e5f0f7;"><strong>Familie Mietus konnte im gleichen Zeitraum bei gleichen Startbedingungen also ${prettifyNumber(
      resultMietus,
      1
    )}-mal so viel Vermögen aufbauen wie Familie Kaufus.</strong></p>`;
  } else {
    detailsHTML += `<p style="border:1px solid black;padding: 0.5em;background-color:#e5f0f7;"><strong>Beide Familien konnten im gleichen Zeitraum bei gleichen Startbedingungen in etwa gleich viel Vermögen aufbauen.</strong></p>`;
  }

  detailsHTML += `<p>Während des gesamten Zeitraumes fielen für Familie Kaufus folgende Kosten an:</p><ul><li>Kaufnebenkosten ${prettifyNumber(
    (kaufnebenkosten / 100) * kaufpreis
  )}&nbsp;€</li><li>Instandhaltungskosten ${prettifyNumber(
    kontoInstandhaltung
  )}&nbsp;€</li><li>Zinszahlungen ${prettifyNumber(
    kontoZinszahlungen
  )}&nbsp;€</li><li>Kapitalertragsteuer ${prettifyNumber(
    kontoKapitalertragsteuerKaufus
  )}&nbsp;€</li></ul><p>Für Familie Mietus hingegen fielen folgende Kosten an:</p><ul><li>Mietzahlungen ${prettifyNumber(
    kontoMietzahlungen
  )}&nbsp;€</li><li>Kapitalertragsteuer ${prettifyNumber(kontoKapitalertragsteuerMietus)}&nbsp;€</li></ul>`;

  if (resultKaufus > resultMietus) {
    detailsHTML += `<h2>Ist Kaufen also besser?</h2>`;
  } else if (resultKaufus < resultMietus) {
    detailsHTML += `<h2>Ist Mieten also besser?</h2>`;
  } else {
    detailsHTML += `<h2>Ist Kaufen oder Mieten nun besser?</h2>`;
  }

  document.querySelector("#details-text").innerHTML = detailsHTML;

  chart = new Chart(document.getElementById("myChart"), {
    type: "line",
    data: {
      labels: Array(zeitraum)
        .fill()
        .map((e, i) => i + 1),
      datasets: [
        {
          label: "Familie Kaufus",
          data: vermoegensentwicklungKaufus,
          borderWidth: 1,
        },
        {
          label: "Familie Mietus",
          data: vermoegensentwicklungMietus,
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: false,
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function (value, index, ticks) {
              return value + 1 + ". Jahr";
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value, index, ticks) {
              return value / 1000 + " T€";
            },
          },
        },
      },
    },
  });
}

function prettifyNumber(num, decimals = 0) {
  const roundedStringNumberRaw = (Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)).toString();
  const [integer, fractional] = roundedStringNumberRaw.split(".");
  const additionalZeros = decimals - (fractional || "").length;
  return (
    [integer.slice(-9, -6), integer.slice(-6, -3), integer.slice(-3)].filter((e) => e).join(".") +
    (decimals > 0 ? "," + (fractional || "") + Array(additionalZeros).fill("0").join("") : "")
  );
}
