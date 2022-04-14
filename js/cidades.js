(async () => {
  async function fetchJSON(arquivo) {
    const response = await fetch(`../json/${arquivo}.json`);
    return response.json();
  }

  const todasCidades = await fetchJSON("todasCidades").then((data) => data);
  const todasCoordenadas = await fetchJSON("todasCoordenadas").then(
    (data) => data
  );

  const input = document.getElementById("divisao-regional");

  let planilhaModelo = {};

  input.onchange = () => {
    const arquivoSelecionado = input.files[0];
    const leitor = new FileReader();

    leitor.onload = (e) => {
      let data = new Uint8Array(e.target.result);
      let workbook = XLSX.read(data, { type: "array" });
      let planilha = workbook.Sheets.Planilha1;

      planilhaModelo = XLSX.utils.sheet_to_json(planilha, {
        defval: "",
        blankrows: true,
      });

      let final = mudarModelo(todasCidades, planilhaModelo);
      gerarPlanilha(final, arquivoSelecionado.name);
    };

    leitor.readAsArrayBuffer(arquivoSelecionado);
  };

  function retornarCidade(source, target) {
    // iterar sobre cada entrada e encontrar a cidade correspondente
    // source = todasCidades
    // target = planilhaModelo
    let cidade = source.find(({ cod_ibge }) => cod_ibge == target);
    // console.log(cidade);
    let coordenadas = todasCoordenadas.find(
      ({ codigo_ibge }) => codigo_ibge == target
    );

    return {
      uf: cidade.uf,
      cep_inicial: cidade.cep_inicial,
      cep_final: cidade.cep_final,
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
    };
  }

  function mudarModelo(source, target) {
    let novoTarget = target.map(function (e) {
      let cidade = retornarCidade(source, +e.CD_GEOCODI);
      // console.log(cidade);
      return {
        ...e,
        cep_inicial: cidade.cep_inicial,
        cep_final: cidade.cep_final,
        uf: cidade.uf,
        latitude: cidade.latitude,
        longitude: cidade.longitude,
      };
    });
    // console.log(novoTarget);

    return novoTarget;
  }

  function gerarPlanilha(json, nome) {
    let ws = XLSX.utils.json_to_sheet(json);
    let wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Planilha1");
    XLSX.writeFile(wb, nome);
  }
})();
