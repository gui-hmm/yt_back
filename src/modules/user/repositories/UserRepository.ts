import { pool } from "../../../pg";
import { v4 as uuidv4 } from "uuid";
import { hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";

class UserRepository {
    
    // Função para criar um novo usuário
    async create(request: Request, response: Response) {
        const { name, email, password } = request.body;

        try {
            const hashedPassword = await hash(password, 10);
            const client = await pool.connect();
            
            const query = 'INSERT INTO "user" (user_id, name, email, password) VALUES ($1, $2, $3, $4)';
            const values = [uuidv4(), name, email, hashedPassword];
            
            await client.query(query, values);
            client.release();

            return response.status(200).json({ message: 'Usuário criado com sucesso' });
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return response.status(500).json({ message: 'Erro ao criar usuário', error });
        }
    }

    // Função de login de usuário
    async login(request: Request, response: Response) {
        const { email, password } = request.body;

        try {
            const client = await pool.connect();
            const query = 'SELECT * FROM "user" WHERE email = $1';
            const { rows } = await client.query(query, [email]);
            client.release();

            if (rows.length === 0) {
                return response.status(401).json({ error: 'Usuário não encontrado' });
            }

            const user = rows[0];
            const passwordMatch = await compare(password, user.password);

            if (!passwordMatch) {
                return response.status(401).json({ error: 'Senha incorreta' });
            }

            const token = sign({
                id: user.user_id,
                email: user.email
            }, process.env.SECRET as string, { expiresIn: '1D' });

            return response.status(200).json({
                token,
                user_id: user.user_id,
                message: 'Usuário conectado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return response.status(500).json({ message: 'Erro ao fazer login', error });
        }
    }

    // Função para buscar dados do usuário pelo token
    async getUser(request: Request, response: Response) {
        try {
            const decoded: any = verify(request.headers.authorization as string, process.env.SECRET as string);

            if (!decoded || !decoded.email) {
                return response.status(400).json({ error: 'Token inválido' });
            }

            const client = await pool.connect();
            const query = 'SELECT * FROM "user" WHERE email = $1';
            const { rows } = await client.query(query, [decoded.email]);
            client.release();

            if (rows.length > 0) {
                const user = rows[0];
                return response.status(200).json({
                    user: {
                        nome: user.name,
                        email: user.email,
                        id: user.user_id,
                    }
                });
            } else {
                return response.status(404).json({ error: 'Usuário não encontrado' });
            }
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return response.status(500).json({ message: 'Erro ao buscar usuário', error });
        }
    }
}

export { UserRepository };
