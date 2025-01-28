from pyrogram import Client
import json

# Ваши данные
api_id = "23171925"
api_hash = "6c6c8933a7f5aff472d1df5b17661f8c"
channel_username = "ru2ch"  # Юзернейм или ID канала
search_keyword = "освободили населённый пункт"  # Слово или фраза для поиска

# Инициализация клиента
app = Client("my_account", api_id=api_id, api_hash=api_hash)

# Получаем данные из канала
locations = []

with app:
    messages = app.search_messages(channel_username, query=search_keyword, limit=300)  # Ограничиваем количество сообщений
    for message in messages:
        if message.text:
            if "освободили" in message.text and "населённый пункт" in message.text:
                # Извлечение названия населённого пункта из текста сообщения
                # Пример: "освободили населённый пункт Михайловка"
                start = message.text.find("освободили населённый пункт") + len("освободили населённый пункт") + 1
                end = message.text.find(" в ДНР")  # Пример для окончания фразы
                location_name = message.text[start:end].strip()
                
                # Очищаем название населённого пункта, оставляя только первое слово
                cleaned_location = location_name.split(' ')[0]
                
                # Добавляем уникальную локацию в список в виде объекта с датой
                if cleaned_location not in [loc['name'] for loc in locations]:
                    locations.append({
                        "name": cleaned_location,
                        "date": message.date.isoformat()  # Сохраняем дату в ISO формате
                    })

# Сохраняем список населённых пунктов в файл в нужном формате
with open("./data/locations.json", "w", encoding="utf-8") as f:
    json.dump(locations, f, ensure_ascii=False, indent=4)

print("Населённые пункты сохранены:", locations)
