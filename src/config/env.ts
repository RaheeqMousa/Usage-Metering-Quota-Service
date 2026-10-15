import "dotenv/config";

const port= Number(process.env.PORT) || 3000;

const dbURL= process.env.DATABASE_URL;
if(!dbURL){
    throw new Error("DATABASE_URL variable is not set inside .env")
}

export const env={
    port,
    dbURL
};