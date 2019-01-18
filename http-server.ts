import * as express from 'express';
import * as redis from 'redis';
const app = express();
const client: redis.RedisClient = redis.createClient();

app.get('/:room', (req: express.Request, res: express.Response) => {
  const room: string = req.params.room;
  client.publish(`test/${room}`, 'value');
  res.send(`Hello ${room}`);
});

app.listen(5000, () => {
  console.log('Example app listening on port 5000!');
});
