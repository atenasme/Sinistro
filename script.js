const consoleElement =
    document.getElementById("console");

const inputElement =
    document.getElementById("userInput");

let variables = {};

let pendingResolve = null;

// ======================================
// CONSOLE
// ======================================

function log(text){

    consoleElement.innerHTML +=
        text + "\n";

    consoleElement.scrollTop =
        consoleElement.scrollHeight;
}

function limparConsole(){

    consoleElement.innerHTML = "";
}

// ======================================
// INPUT
// ======================================

function enviarEntrada(){

    if(!pendingResolve) return;

    const valor =
        inputElement.value;

    inputElement.value = "";

    pendingResolve(valor);

    pendingResolve = null;
}

function esperarEntrada(){

    return new Promise(resolve => {

        pendingResolve = resolve;
    });
}

// ======================================
// EXPRESSÕES
// ======================================

function avaliar(expressao){

    try{

        return Function(
            ...Object.keys(variables),
            "return (" + expressao + ");"
        )(...Object.values(variables));

    }catch{

        throw new Error(
            "Erro na expressão: " +
            expressao
        );
    }
}

// ======================================
// EXECUTAR BLOCO
// ======================================

async function executarBloco(linhas){

    for(
        let i = 0;
        i < linhas.length;
        i++
    ){

        let linha =
            linhas[i]
            .replace(/\r/g, "")
            .trim();

        // ==========================
        // IGNORAR LINHA VAZIA
        // ==========================

        if(linha === ""){
            continue;
        }

        // ==========================
        // INICIO / FIM
        // ==========================

        if(
            linha === "INICIO" ||
            linha === "FIM"
        ){
            continue;
        }

        // ==========================
        // GUARDAR
        // ==========================

        if(
            linha.startsWith(
                "GUARDAR"
            )
        ){

            let conteudo =
                linha
                .substring(8)
                .trim();

            let nomes =
                conteudo.split(",");

            for(let nome of nomes){

                nome = nome.trim();

                if(nome !== ""){

                    variables[nome] = 0;
                }
            }

            continue;
        }

        // ==========================
        // LER
        // ==========================

        if(
            linha.startsWith(
                "LER("
            )
        ){

            let fecha =
                linha.lastIndexOf(")");

            let variavel =
                linha
                .substring(4, fecha)
                .trim();

            log(
                "Entrada para " +
                variavel +
                ":"
            );

            const entrada =
                await esperarEntrada();

            const numero =
                Number(entrada);

            variables[variavel] =
                isNaN(numero)
                ? entrada
                : numero;

            continue;
        }

        // ==========================
        // MOSTRAR
        // ==========================

        if(
            linha.startsWith(
                "MOSTRAR("
            )
        ){

            let fecha =
                linha.lastIndexOf(")");

            let conteudo =
                linha
                .slice(9, fecha)
                .trim();

            let resultado =
                avaliar(conteudo);

            log(
                String(resultado)
            );

            continue;
        }

        // ==========================
        // ESCREVER
        // ==========================

        if(
            linha.startsWith(
                "ESCREVER("
            )
        ){

            let fecha =
                linha.lastIndexOf(")");

            let conteudo =
                linha
                .slice(9, fecha)
                .trim();

            // Variável

            if(
                variables.hasOwnProperty(
                    conteudo
                )
            ){

                log(
                    String(
                        variables[conteudo]
                    )
                );

            }else{

                // Expressão

                try{

                    let resultado =
                        avaliar(
                            conteudo
                        );

                    log(
                        String(
                            resultado
                        )
                    );

                }catch{

                    // Texto puro

                    log(conteudo);
                }
            }

            continue;
        }

        // ==========================
        // SE / SENAO
        // ==========================

        if(
            linha.startsWith(
                "SE("
            )
        ){

            let fecha =
                linha.lastIndexOf(")");

            let condicao =
                linha
                .substring(3, fecha)
                .trim();

            let blocoSe = [];

            let blocoSenao = [];

            let usandoSenao =
                false;

            i++;

            while(
                i < linhas.length
            ){

                let atual =
                    linhas[i]
                    .replace(/\r/g, "")
                    .trim();

                // SENAO

                if(
                    atual === "SENAO"
                ){

                    usandoSenao = true;

                    i++;

                    continue;
                }

                // FIMSE

                if(
                    atual === "FIMSE"
                ){
                    break;
                }

                // Adicionar linha

                if(usandoSenao){

                    blocoSenao.push(
                        linhas[i]
                    );

                }else{

                    blocoSe.push(
                        linhas[i]
                    );
                }

                i++;
            }

            // Executar condição

            if(
                avaliar(condicao)
            ){

                await executarBloco(
                    blocoSe
                );

            }else{

                await executarBloco(
                    blocoSenao
                );
            }

            continue;
        }

        // ==========================
        // ATRIBUIÇÃO
        // ==========================

        if(
            linha.includes("=")
        ){

            let partes =
                linha.split("=");

            let variavel =
                partes[0]
                .trim();

            let expressao =
                partes
                .slice(1)
                .join("=")
                .trim();

            variables[variavel] =
                avaliar(expressao);

            continue;
        }

        // ==========================
        // COMANDO DESCONHECIDO
        // ==========================

        log(
            "Comando desconhecido: " +
            linha
        );
    }
}

// ======================================
// EXECUTAR
// ======================================

async function executarCodigo(){

    limparConsole();

    variables = {};

    let codigo =
        document
        .getElementById(
            "editor"
        )
        .value;

    let linhas =
        codigo
        .replace(/\r/g, "")
        .split("\n");

    try{

        await executarBloco(
            linhas
        );

        log(
            "\nExecução finalizada."
        );

    }catch(err){

        log(
            "\nERRO: " +
            err.message
        );
    }
}

// ======================================
// EXEMPLO
// ======================================

function carregarExemplo(){

document.getElementById("editor").value =
`INICIO

GUARDAR x, y, soma

ESCREVER(Bem vindo ao pseudoC)

LER(x)
LER(y)

soma = x + y

ESCREVER(Resultado:)

MOSTRAR(soma)

SE(soma > 10)

    ESCREVER(Maior que 10)

SENAO

    ESCREVER(Menor ou igual a 10)

FIMSE

MOSTRAR(x + y)

FIM`;
}