echo "scp in service"

scp -i /Users/topbrids/cert/testbbs.pem index.js root@101.32.178.79:/root/t_martin_quant


# scp -i /Users/topbrids/cert/testbbs.pem app/binanceApi.js root@101.32.178.79:/root/t_martin_quant/app
# scp -i /Users/topbrids/cert/testbbs.pem app/message.js root@101.32.178.79:/root/t_martin_quant/app

# scp -i /Users/topbrids/cert/testbbs.pem data/data.json root@101.32.178.79:/root/t_martin_quant/data

# scp -i /Users/topbrids/cert/testbbs.pem package.json root@101.32.178.79:/root/t_martin_quant/

scp -i /Users/topbrids/cert/testbbs.pem data/runBetData.js root@101.32.178.79:/root/t_martin_quant/data

# scp -i /Users/topbrids/cert/testbbs.pem data/img/aelf.jpg root@101.32.178.79:/root/t_martin_quant/data/img