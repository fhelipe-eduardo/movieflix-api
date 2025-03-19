"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("../swagger.json"));
const port = 3000;
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        }
    });
    res.json(movies);
});
app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;
    try {
        // Verificar no banco se já existe o filme
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        });
        if (movieWithSameTitle) {
            return res.status(409).send({ messsage: "Filme já cadastrado" });
        }
        ;
        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date)
            }
        });
    }
    catch (error) {
        return res.status(500).send({ message: "Falha ao cadastrar um filme" });
    }
    ;
    res.status(201).send();
});
app.put("/movies/:id", async (req, res) => {
    // pegar id do registro a ser atualizado
    const id = Number(req.params.id);
    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id
            }
        });
        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }
        const data = { ...req.body };
        console.log(data);
        data.release_date = data.release_date ? new Date(data.release_date) : undefined;
        // pegar dados do filme a ser atualizado e atualizar no prisma
        await prisma.movie.update({
            where: {
                id
            },
            data: data
        });
    }
    catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar o registro do filme" });
    }
    // retornar status correto informando que o filme foi atualizado
    res.status(200).send();
});
app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const movie = await prisma.movie.findUnique({ where: { id } });
        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }
        await prisma.movie.delete({ where: { id } });
    }
    catch (error) {
        return res.status(500).send({ message: "Não foi possível remover o fime" });
    }
    res.status(200).send();
});
app.get("/movies/:genreName", async (req, res) => {
    // receber o nome do gênero pelo parâmetro da rota
    // console.log(req.params.genreName);
    // filtrar os filmes do banco pelo gênero
    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: "insensitive"
                    }
                }
            }
        });
        // retornar os filmes filtrados na resposta da rota
        res.status(200).send(moviesFilteredByGenreName);
    }
    catch (error) {
        res.status(500).send({ message: "Falha ao filtrar filmes por gênero" });
    }
});
app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
