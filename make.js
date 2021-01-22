var fs = require('fs');
var util = require('util')
var tomlify = require('tomlify-j0.4');

var ip_addr = process.argv.slice(2);
var byzantine_node = process.argv.slice(3) == "-b";
var vals = 4;
var set_vals = 4; /// Number of validators in the set
var accs = 20;

var keys = JSON.parse(fs.readFileSync('setup/keys.json', 'utf8'));
var node_keys = JSON.parse(fs.readFileSync('setup/node_keys.json', 'utf8'));
var genesis = JSON.parse(fs.readFileSync('setup/genesis.json', 'utf8'));
var config = JSON.parse(fs.readFileSync('setup/config.json', 'utf8'));

var capnp_port = 35471;
var http_port = 8081;
var bootstraps = [];

for(var i = 0; i < set_vals; i++) {
  genesis.validators.push({
    "address": keys[i].address,
    "stake":100000000,
    "publicKey":keys[i].public_key,
  });
}

// account + validator + seed node
for(var i = vals+1; i < vals+1+accs; i++) {
  genesis.accounts.push({
    "address": keys[i].address,
    "balance":100000000,
  });
}


run_bash = '#!/bin/bash\n\n'
run_bash += "TMUX_SESSION='zarb-testnet';\n\n"
run_bash += "tmux new -d -s ${TMUX_SESSION};\n"
run_bash += "tmux splitw -v;\n"
run_bash += "tmux splitw -h;\n"
run_bash += "tmux selectp -D;\n"
run_bash += "tmux splitw -h;\n"

if (fs.existsSync("testnet")) {
    var rimraf = require('rimraf');
    rimraf('testnet', function () {
        create_nodes();
    });
} else {
    create_nodes();
}


function create_nodes() {
  fs.mkdirSync("testnet");

  for(var i = 0; i < vals; i++) {
    dir = process.cwd()+"/testnet/node"+i+"/";
    fs.mkdirSync(dir);

    config.Capnp.Address = "[::]:" + (capnp_port+i);
    config.Http.Address = "[::]:" + (http_port+i);

    var text1 = tomlify.toToml(config, {space: 2, replace: function (key, value) {
      var context = this;
      var path = tomlify.toKey(context.path);

      if (typeof value == 'number') {
        if (path.indexOf('Prob') !== -1) {
          return false;
        } else {
          return value.toFixed(0);  // Change the text transformed from the value.
        }
      }

      return false;  // Let tomlify decide for you.
    }});
    var text2 = JSON.stringify(genesis);

    // node_keys
    fs.writeFile(dir+"node_key", node_keys[i].private_key, function(error) {});

    fs.writeFile(dir+"config.toml", text1, function(error) {});
    fs.writeFile(dir+"genesis.json", text2, function(error) {});

    //run_bash += util.format("sleep 1\n");
    run_bash += util.format("rm -rf %s/data/data\n", dir);

    // let make the last node byzantine node
    if (byzantine_node && i==vals-1)
      run_bash += util.format("tmux send -t %i 'zarb_byzantine start -w=%s -p=%s' ENTER; \n", i, dir, keys[i].private_key);
    else
      run_bash += util.format("tmux send -t %i 'zarb start -w=%s -p=%s' ENTER; \n", i, dir, keys[i].private_key);
  }

  run_bash += "tmux attach -t ${TMUX_SESSION};";

  fs.writeFile("testnet/run.sh", run_bash, function(error) {});
}
