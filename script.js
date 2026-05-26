const consoleElement = document.getElementById("console");
const inputElement = document.getElementById("userInput");

let variables = {};
let pendingResolve = null;

function log(text){
    consoleElement.innerHTML += text + "\\n";
    consoleElement.scrollTop = consoleElement.scrollHeight;
}

function limparConsole(){
    consoleElement.innerHTML = "";
}

function enviarEntrada(){

    if(pendingResolve){

        const value = inputElement.value;

        inputElement.value = "";

        pendingResolve(value);

        pendingResolve = null;
    }
}

function esperarEntrada(){

    return new Promise(resolve => {

        pendingResolve = resolve;
    });
}

function avaliar(expr){

    try{

        return Function(
            ...Object.keys(variables),
            `return ${expr}`
        )(...Object.values(variables));

    }catch(err){

        throw new Error("Erro na expressão: " + expr);
    }
}

async function executarBloco(linhas){

    for(let i = 0; i < linhas.length; i++){

        let linha = linhas[i].trim();

        if(!linha) continue;

        if(linha === "INICIO" || linha === "FIM"){
            continue;
        }

        // =====================
        // GUARDAR
        // =====================

        if(linha.startsWith("GUARDAR")){

            const vars = linha
                .replace("GUARDAR", "")
                .split(",");

            vars.forEach(v => {

                const nome = v.trim();

                if(nome.length > 0){
                    variables[nome] = 0;
                }
            });

            continue;
        }

        // =====================
        // LER
        // =====================

        if(linha.startsWith("LER(")){

            const variavel = linha
                .slice(4, -1)
                .trim();

            log("Entrada para " + variavel + ":");

            const entrada = await esperarEntrada();

            const numero = Number(entrada);

            variables[variavel] = isNaN(numero)
                ? entrada
                : numero;

            continue;
        }

        // =====================
        // MOSTRAR
        // =====================

        if(linha.startsWith("MOSTRAR(")){

            const conteudo = linha
                .slice(8, -1)
                .trim();

            if(variables.hasOwnProperty(conteudo)){

                log(String(variables[conteudo]));

            }else{

                log(String(avaliar(conteudo)));
            }

            continue;
        }

        // =====================
        // SE / SENAO
        // =====================

        if(linha.startsWith("SE(")){

            const condicao = linha
                .slice(3, -1)
                .trim();

            let blocoSe = [];
            let blocoSenao = [];

            i++;

            let usandoSenao = false;

            while(i < linhas.length){

                let atual = linhas[i].trim();

                if(atual === "SENAO"){

                    usandoSenao = true;

                    i++;

                    continue;
                }

                if(atual === "FIMSE"){
                    break;
                }

                if(usandoSenao){

                    blocoSenao.push(linhas[i]);

                }else{

                    blocoSe.push(linhas[i]);
                }

                i++;
            }

            if(avaliar(condicao)){

                await executarBloco(blocoSe);

            }else{

                await executarBloco(blocoSenao);
            }

            continue;
        }

        // =====================
        // ATRIBUIÇÃO
        // =====================

        if(linha.includes("=")){

            const partes = linha.split("=");

            const nome = partes[0].trim();

            const expr = partes
                .slice(1)
                .join("=")
                .trim();

            variables[nome] = avaliar(expr);

            continue;
        }

        // =====================
        // ERRO
        // =====================

        log("Comando desconhecido: " + linha);
    }
}

async function executarCodigo(){

    limparConsole();

    variables = {};

    const codigo = document
        .getElementById("editor")
        .value;

    const linhas = codigo.split("\\n");

    try{

        await executarBloco(linhas);

        log("\\nExecução finalizada.");

    }catch(err){

        log("\\nERRO: " + err.message);
    }
}

function carregarExemplo(){

document.getElementById("editor").value =
`INICIO

GUARDAR x, y, soma

LER(x)
LER(y)

soma = x + y

SE(soma > 10)
    MOSTRAR(soma)
SENAO
    MOSTRAR(0)
FIMSE

FIM`;
}