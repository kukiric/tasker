function panic(err) {
    console.error(`\nUncaught ${err.stack}`);
    console.error(`\n${err.toString()}`);
    process.exit(1);
}

try {
    // Trata erros incuráveis da aplicação
    process.on("unhandledRejection", panic);
    // Carrega as configurações da aplicação
    require("dotenv").config();
    // Busca os módulos a partir do diretório raiz
    require("app-module-path").addPath(__dirname);
    // Inicia a aplicação em TypeScript (requer ts-node ou scripts compilados)
    require("start/main");
}
catch (err) {
    panic(err);
}
