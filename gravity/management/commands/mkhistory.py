# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from gravity.models import create_event, Room
import random
import datetime


class Command(BaseCommand):
    help = "Checks for common inconsistencies"

    def handle(self, *a, **kw):
        NAMES = 'Peter Alex Hardy Bettina Martin Katharina David Anna Eva Maria'.split()
        TAGS = 'Fahrrad Uni SAP Buffet Vegetarier will_tanzen Klettern Bier'.split()

        rooms = [
            Room.objects.create(name="Hackathon 2013"),
            Room.objects.create(name="Hochzeit Klaus und Inge")
        ]

        for room in rooms:
            START_TS = 1370683681
            HORIZON_SEC = 240

            # history = list()

            NUM = 40

            tss = [START_TS + random.randint(0, HORIZON_SEC) for i in range(NUM)]

            tss.sort()

            for _id, _ts in enumerate(tss):
                create_event(
                    room=room,
                    user_name=random.choice(NAMES),
                    tag_label=random.choice(TAGS),
                    timestamp=datetime.datetime.fromtimestamp(_ts)
                )

        #     history.append(_event)
        # print(json.dumps(history))
