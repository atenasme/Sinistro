// =====================================
// PSEUDOC INTERPRETER
// =====================================

const consoleElement =
    document.getElementById("console");

const inputElement =
    document.getElementById("userInput");

let variables = {};

let pendingResolve = null;

// =====================================
// CONSOLE
// =====================================

function log(text){

    consoleElement.innerHTML +=
        text + "\n";

    consoleElement.scrollTop =
        consoleElement.scrollHeight;
}

function limparConsole(){

    consoleElement.innerHTML = "";
}

// =====================================
// INPUT
// =====================================

function enviarEntrada(){

    if(!pendingResolve){
        return;
    }

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

// =====================================
// VALIDAR VARIÁVEIS
// =====================================

function validarVariaveis(expressao){

    const tokens =
        expressao.match(
            /[a-zA-Z_][a-zA-Z0-9_]*/g
        ) || [];

    for(const token of tokens){

        // Ignorar palavras JS

        if([
            "true",
            "false",
            "null",
            "undefined"
        ].includes(token)){
            continue;
        }

        // Variável não existe

        if(
            !variables.hasOwnProperty(
                token
            )
        ){

            throw new Error(
                "Variável inexistente: " +
                token
            );
        }
    }
}

// =====================================
// AVALIAR EXPRESSÃO
// =====================================

function avaliar(expressao){

    expressao =
        expressao.trim();

    if(expressao === ""){

        throw new Error(
            "Expressão vazia"
        );
    }

    validarVariaveis(expressao);

    try{

        return Function(
            ...Object.keys(variables),
            `"use strict";
            return (${expressao});`
        )(...Object.values(variables));

    }catch{

        throw new Error(
            "Erro na expressão: " +
            expressao
        );
    }
}

// =====================================
// EXTRAIR CONTEÚDO
// =====================================

function extrairComando(
    linha,
    comando
){

    const regex =
        new RegExp(
            "^" +
            comando +
            "\\((.*)\\)$"
        );

    const match =
        linha.match(regex);

    if(!match){

        throw new Error(
            "Sintaxe inválida: " +
            linha
        );
    }

    return match[1].trim();
}

// =====================================
// EXECUTAR BLOCO
// =====================================

async function executarBloco(linhas){

    for(
        let i = 0;
        i < linhas.length;
        i++
    ){

        let linha =
            linhas[i];

        // Normalizar

        linha = linha
            .replace(/\r/g, "")
            .trim();

        // Ignorar vazio

        if(linha === ""){
            continue;
        }

        // =================================
        // INICIO / FIM
        // =================================

        if(
            linha === "INICIO" ||
            linha === "FIM"
        ){
            continue;
        }

        // =================================
        // GUARDAR
        // =================================

        if(
            linha.startsWith(
                "GUARDAR "
            )
        ){

            const conteudo =
                linha
                .replace(
                    "GUARDAR",
                    ""
                )
                .trim();

            const lista =
                conteudo.split(",");

            for(let nome of lista){

                nome = nome.trim();

                if(nome === ""){
                    continue;
                }

                variables[nome] = 0;
            }

            continue;
        }

        // =================================
        // LER
        // =================================

        if(
            linha.startsWith(
                "LER("
            )
        ){

            const variavel =
                extrairComando(
                    linha,
                    "LER"
                );

            if(
                !variables.hasOwnProperty(
                    variavel
                )
            ){

                throw new Error(
                    "Variável não declarada: " +
                    variavel
                );
            }

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

        // =================================
        // MOSTRAR
        // =================================

        if(
            linha.startsWith(
                "MOSTRAR("
            )
        ){

            const conteudo =
                extrairComando(
                    linha,
                    "MOSTRAR"
                );

            try{

                const resultado =
                    avaliar(
                        conteudo
                    );

                log(
                    String(
                        resultado
                    )
                );

            }catch{

                log(conteudo);
            }

            continue;
        }

        // =================================
        // ESCREVER
        // =================================

        if(
            linha.startsWith(
                "ESCREVER("
            )
        ){

            const conteudo =
                extrairComando(
                    linha,
                    "ESCREVER"
                );

            // Variável

            if(
                variables.hasOwnProperty(
                    conteudo
                )
            ){

                log(
                    String(
                        variables[
                            conteudo
                        ]
                    )
                );

                continue;
            }

            // Expressão

            try{

                const resultado =
                    avaliar(
                        conteudo
                    );

                log(
                    String(
                        resultado
                    )
                );

            }catch{

                // Texto

                log(conteudo);
            }

            continue;
        }

        // =================================
        // SE
        // =================================

        if(
            linha.startsWith(
                "SE("
            )
        ){

            const condicao =
                extrairComando(
                    linha,
                    "SE"
                );

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
                    .replace(
                        /\r/g,
                        ""
                    )
                    .trim();

                if(atual === ""){
                    i++;
                    continue;
                }

                // SENAO

                if(
                    atual === "SENAO"
                ){

                    usandoSenao =
                        true;

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

            // Validar fechamento

            if(
                i >= linhas.length
            ){

                throw new Error(
                    "FIMSE não encontrado"
                );
            }

            // Executar

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

        // =================================
        // ATRIBUIÇÃO
        // =================================

        if(
            linha.includes("=")
        ){

            const partes =
                linha.split("=");

            if(
                partes.length < 2
            ){

                throw new Error(
                    "Atribuição inválida"
                );
            }

            const variavel =
                partes[0]
                .trim();

            const expressao =
                partes
                .slice(1)
                .join("=")
                .trim();

            if(
                !variables.hasOwnProperty(
                    variavel
                )
            ){

                throw new Error(
                    "Variável não declarada: " +
                    variavel
                );
            }

            variables[variavel] =
                avaliar(expressao);

            continue;
        }

        // =================================
        // COMANDO DESCONHECIDO
        // =================================

        throw new Error(
            "Comando desconhecido: " +
            linha
        );
    }
}

// =====================================
// EXECUTAR CÓDIGO
// =====================================

async function executarCodigo(){

    limparConsole();

    variables = {};

    const codigo =
        document
        .getElementById(
            "editor"
        )
        .value;

    const linhas =
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

// =====================================
// EXEMPLO
// =====================================

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