import express from 'express'
import cors from 'cors'
import { generate } from './chatbot.js'

const app = express()
const port = 3001
app.use(cors())
app.use(express.json())

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to GPT!')
})

app.post('/chat', async (req, res) => {
    const result = await generate(req.body.message)
    res.send({ message: result });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
