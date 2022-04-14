(async function () {
  async function fetchJSON(arquivo) {
    const response = await fetch(`../json/${arquivo}.json`);
    const json = await response.json();

    return json;
  }

  const todosBairros = await fetchJSON("todosBairros").then((data) => data);
  const todasCidades = await fetchJSON("todasCidades").then((data) => data);

  // planilha retornada do XLSX
  var planilhaVEC = {};

  function retornarLinha(base, start, end) {
    // base = todosBairros.json
    // filtrar valores cepInicial e cepFinal usando start e end
    let linhaBairro = base.find(
      ({ cepInicial, cepFinal }) => cepInicial == +start && cepFinal == +end
    );

    // let linhaCidade = todasCidades.find(
    //   ({ cep_inicial, cep_final }) => cep_inicial == +start && cep_final == +end
    // );

    let linhaCidade = todasCidades.find(
      ({ cep_inicial, cep_final }) => cep_inicial == +start
    );

    if (linhaBairro == undefined) {
      return linhaCidade;
    }
    return linhaBairro;
  }

  function renderStatus(mensagem) {
    return (document.querySelector(".status").innerText = mensagem);
  }

  function retornarLinhas(base, entradas) {
    // base = todosBairros.json
    // iterar sobre entradas
    let arr = [];
    entradas.forEach(
      ({ ZipCodeStart, ZipCodeEnd, AbsoluteMoneyCost }, index) => {
        let linha = retornarLinha(base, ZipCodeStart, ZipCodeEnd);
        let taxa = Number(AbsoluteMoneyCost).toFixed(2);

        renderStatus("Compilando bairros e preços...");

        if (linha == undefined) {
          arr.push({
            cepInicial: ZipCodeStart,
            cepFinal: ZipCodeEnd,
            UF: "??",
            Localidade: "??",
            Cidade: "??",
            Taxa: taxa,
          });
        }

        // Essa estrutura filtra valores duplicados
        // if (
        //   linha != undefined &&
        //   !arr.find((e) => Object.values(e).includes(linha.bairro))
        // ) {
        //   arr.push({
        //     UF: !!linha.estado ? linha.estado : linha.uf,
        //     Localidade: !!linha.bairro ? linha.bairro : linha.cidade,
        //     Cidade: linha.cidade,
        //     Taxa: taxa,
        //   });
        // }

        if (linha != undefined) {
          arr.push({
            cepInicial: ZipCodeStart,
            cepFinal: ZipCodeEnd,
            UF: !!linha.estado ? linha.estado : linha.uf,
            Localidade: !!linha.bairro ? linha.bairro : linha.cidade,
            Cidade: linha.cidade,
            Taxa: taxa,
          });
        }
      }
    );

    return arr;
  }

  // testes

  // lidar com o upload da planilha

  const arquivoInput = document.getElementById("arquivo-xlsx");

  arquivoInput.onchange = () => {
    const arquivoSelecionado = arquivoInput.files[0];
    const leitor = new FileReader();

    leitor.onload = function (e) {
      let data = new Uint8Array(e.target.result);
      let workbook = XLSX.read(data, { type: "array" });
      let planilha = workbook.Sheets.Sheet1;

      renderStatus(".status", "Processando planilha...");

      planilhaVEC = XLSX.utils.sheet_to_json(planilha);

      renderStatus("Gerando planilha com bairros...");

      gerarPlanilha(todosBairros, planilhaVEC, arquivoSelecionado.name);
    };

    leitor.readAsArrayBuffer(arquivoSelecionado);
  };

  // gerar download da planilha com os bairros

  function gerarPlanilha(base, vec, nome) {
    let ws = XLSX.utils.json_to_sheet(retornarLinhas(base, vec));
    let wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, nome);
  }
})();
