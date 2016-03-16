#!/bin/bash

BASE_URL='http://localhost:63123'

STATUS=$(curl --write-out %{http_code} --silent --output /dev/null $BASE_URL/status)

if ! [[ "$STATUS" == 200 ]]; then
	echo -e 'Oops,\n you should have a look at the Showmator Server. It seems like something is broken.' | mail -s "The Showmator Server is down" "mail@showmator.com"
fi