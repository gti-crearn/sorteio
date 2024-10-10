import { useEffect, useState } from 'react'
import './App.css'
import * as XLSX from 'xlsx';  // Biblioteca para ler Excel

function App() {
  // const [count, setCount] = useState(0)

  // return (
  //   <>
  //     <div>
  //       <a href="https://vitejs.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.tsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p>
  //   </>
  // )
  const [rangeMin, setRangeMin] = useState<number>(1);
  const [rangeMax, setRangeMax] = useState<number>(10);
  const [numerosSorteados, setNumerosSorteados] = useState<{ numero: number, nome: string, telefone: string }[]>([]);
  const [numeroAtual, setNumeroAtual] = useState<number | null>(null);
  const [isSorteando, setIsSorteando] = useState<boolean>(false);
  const [dadosExcel, setDadosExcel] = useState<any[]>([]);

  useEffect(() => {
    const sorteados = JSON.parse(localStorage.getItem('numerosSorteados') || '[]');
    setNumerosSorteados(sorteados);
  }, []);

  const sortearNumero = () => {
    if (isSorteando) return;

    const numerosDisponiveis: number[] = [];

    for (let i = rangeMin; i <= rangeMax; i++) {
      if (!numerosSorteados.some(item => item.numero === i)) {
        numerosDisponiveis.push(i);
      }
    }

    if (numerosDisponiveis.length === 0) {
      alert('Todos os números foram sorteados!');
      return;
    }

    setIsSorteando(true);
    let contador = 0;
    const intervalo = setInterval(() => {
      const numeroAleatorio = Math.floor(Math.random() * (rangeMax - rangeMin + 1)) + rangeMin;
      setNumeroAtual(numeroAleatorio);
      contador += 1;

      if (contador > 20) {
        clearInterval(intervalo);
        const numeroFinal = numerosDisponiveis[Math.floor(Math.random() * numerosDisponiveis.length)];
        setNumeroAtual(numeroFinal);

        const pessoaSorteada = buscarPessoaPorNumero(numeroFinal);
        const novoSorteado = { numero: numeroFinal, ...pessoaSorteada };

        const novosSorteados = [...numerosSorteados, novoSorteado];
        setNumerosSorteados(novosSorteados);
        localStorage.setItem('numerosSorteados', JSON.stringify(novosSorteados));
        setIsSorteando(false);
      }
    }, 100);
  };

  const buscarPessoaPorNumero = (numero: number): { nome: string, telefone: string } => {
    console.log("Dados no Excel:", dadosExcel);
    const resultado = dadosExcel.find((linha: any) => linha.numero === numero);
    return resultado ? { nome: resultado.nome, telefone: resultado.telefone } : { nome: 'Nome não encontrado', telefone: 'Telefone não encontrado' };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Explicitamente definindo o tipo de `jsonData`
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Encontrar os índices das colunas "Nome" e "Telefone"
        const headerRow = jsonData[0] as string[];
        const nomeColumnIndex = headerRow.indexOf('Nome');
        const telefoneColumnIndex = headerRow.indexOf('Telefone');

        if (nomeColumnIndex === -1 || telefoneColumnIndex === -1) {
          alert('Colunas "Nome" e/ou "Telefone" não encontradas no arquivo.');
          return;
        }

        // Mapear os dados com índices, especificando o tipo correto
        const dadosComIndices = jsonData.slice(1).map((row: any[], index: number) => ({
          numero: index + 1,
          nome: row[nomeColumnIndex] || 'Nome não disponível',
          telefone: row[telefoneColumnIndex] || 'Telefone não disponível',
        }));

        console.log("Dados lidos do Excel com índices:", dadosComIndices);
        setDadosExcel(dadosComIndices);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const resetarSorteio = () => {
    setNumerosSorteados([]);
    setNumeroAtual(null);
    localStorage.removeItem('numerosSorteados');
  };

  return (
    <>
      <div className='range'>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div className="mb-4">
            <label className="block mb-2">Range Mínimo </label>
            <input
              type="number"
              value={rangeMin}
              onChange={(e) => setRangeMin(Number(e.target.value))}
              className="input_sorteio"
              min={1}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Range Máximo </label>
            <input
              type="number"
              value={rangeMax}
              onChange={(e) => setRangeMax(Number(e.target.value))}
              className="input_sorteio"
            />
          </div>
          <div className="mb-4">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="input_file" />
          </div>
        </div>

      </div>
      <div className="content">
        <div className='sorteio'>
          <h1 className="text-4xl font-bold mb-4">SORTEIO</h1>

          <div className="numero_sorteado">
            <h1 className={`text-5xl font-bold ${isSorteando ? 'animate-pulse' : ''}`}>
              {numeroAtual === null ? 0 : numeroAtual}
            </h1>
          </div>
          <div className="content_buttons">
            <button
              onClick={sortearNumero}
              className="button_sorteio">
              {isSorteando ? 'Sorteando...' : 'SORTEAR'}
            </button>
            <button
              onClick={resetarSorteio}
              disabled={isSorteando}
              className="button_reset">
              RESETAR
            </button>
          </div>

        </div>

        {numerosSorteados.length > 0 && (
          <div className="content_sorteados">
            <h3 >NÚMERO SORTEADO</h3>

            {numerosSorteados.map((item) => (
              <li key={item.numero} style={{ display: "flex", width: "100%", fontSize: "4rem", alignItems: "center", gap: "0.5rem", justifyContent: "start" }}>
                <strong style={{ fontSize: "4rem" }}>{item.numero} - {item.nome?.toUpperCase() } </strong>
                <span> {item.telefone}</span>
              </li>
            ))}

          </div>
        )}
      </div>
    </>
  );
}

export default App
