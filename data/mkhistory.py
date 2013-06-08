#!/usr/bin/env python

import random
import json

NAMES = 'Peter Alex Hardy Bettina Martin Katharina David Anna Eva Maria'.split()
TAGS = 'Fahrrad Uni SAP Buffet Vegetarier will_tanzen Klettern Bier'.split()

START_TS = 1370683681
HORIZON_SEC = 120

history = list()

NUM = 40

tss = [ START_TS + random.randint(0, HORIZON_SEC) for i in range(NUM) ]

tss.sort()

for _id, _ts in enumerate( tss ):
    _name = random.choice(NAMES)
    _tag = random.choice(TAGS)

    _event = {'name' : _name, 'tag' : _tag, 'id' : _id, 'ts' : _ts }

    history.append(_event)

print(json.dumps(history))

