# Zarb Local TestNet

With this repository you car run zarb testnet without using dockers or kubernetes.

### How to use:
- install nodejs and tmux.
- install [zarb](https://github.com/zarbchain/zarb-go).
- run `npm install`
- run `node make.js` to create nodes
- run `sh testnet/run.sh` to run the nodes

### How to terminate:
To kill all running instances:
- run `pkill zarb`

### License
MIT <br>
NO WARRANTY IS IMPLIED, USE AT YOUR OWN RISK!
