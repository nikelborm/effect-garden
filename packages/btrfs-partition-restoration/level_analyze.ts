import { Level } from 'level';

// const levelPath = '/home/recov/.config/google-chrome/Default/Sync Data/LevelDB'
// const levelPath = 'LevelDB_Snapshot'

const sadSet = new Set()

for (const levelPath of [
    'out_live/chrome_default_leveldb/recovered_from_id_2676034174976/@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB',
    'out_live/chrome_default_leveldb/recovered_from_id_2676133003264/@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB',
    'out_live/chrome_default_leveldb/recovered_from_id_2676333576192/@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB',
    'out_live/chrome_default_leveldb/recovered_from_id_2676343554048/@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB',
]) {
    const db = new Level(levelPath, { valueEncoding: 'utf-8', keyEncoding: 'utf-8' })

    for await (const [key, value] of db.iterator()) {
        if (
            // ['webaudio',
            //     'asdasd',
            //     'promotions',
            //     'helloworld',
            //     'w3c',
            //     'telega',
            //     'edrfgh',
            //     'folder',
            //     'hello',
            //     'nvbioreuqb9v7y384qt'].some(e => value.includes(e))
            //     && 
            key.startsWith('saved_tab_group')
        )
            {
                let indexTest = value.indexOf('https')
                if(indexTest === -1) indexTest = value.indexOf('http')
                if(indexTest === -1) indexTest = 0
                sadSet.add(value.slice(indexTest))
            }

    }
    // 'saved_tab_group-md-49fd96c8-8fa9-4b62-a651-cee1a2c02924'
    await db.close()
}






console.log(sadSet)