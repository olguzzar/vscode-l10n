/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { XLF } from "../xlf";

describe('XLF', () => {
    context('toString', () => {
        it('bundle files', () => {
            const xlf = new XLF();
            xlf.addFile('bundle', { Hello: 'Hello' });
            const result = xlf.toString();
            assert.strictEqual(result, '<?xml version="1.0" encoding="utf-8"?>\r\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">\r\n  <file original="bundle" source-language="en" datatype="plaintext"><body>\r\n    <trans-unit id="++CODE++185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969">\r\n      <source xml:lang="en">Hello</source>\r\n    </trans-unit>\r\n  </body></file>\r\n</xliff>');
        });
    
        it('package files', () => {
            const xlf = new XLF();
            xlf.addFile('package', { Hello: 'World' });
            const result = xlf.toString();
            assert.strictEqual(result, '<?xml version="1.0" encoding="utf-8"?>\r\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">\r\n  <file original="package" source-language="en" datatype="plaintext"><body>\r\n    <trans-unit id="Hello">\r\n      <source xml:lang="en">World</source>\r\n    </trans-unit>\r\n  </body></file>\r\n</xliff>');
        });

        it('sorts files by name and items by message', () => {
            const xlf = new XLF();
            xlf.addFile('b', { b: 'b', a: 'a' });
            xlf.addFile('a', { b: 'b', a: 'a' });
            const result = xlf.toString();
            const header = '<?xml version="1.0" encoding="utf-8"?>\r\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">\r\n  <file original="a" source-language="en" datatype="plaintext"><body>';
            const a = '\r\n    <trans-unit id="++CODE++ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb">\r\n      <source xml:lang="en">a</source>\r\n    </trans-unit>';
            const b = '\r\n    <trans-unit id="++CODE++3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d">\r\n      <source xml:lang="en">b</source>\r\n    </trans-unit>';
            const nextFile = '\r\n  </body></file>\r\n  <file original="b" source-language="en" datatype="plaintext"><body>';
            const footer = '\r\n  </body></file>\r\n</xliff>';

            assert.strictEqual(result, header + a + b + nextFile + a + b + footer);
        });
    
        it('escapes things correctly', () => {
            const xlf = new XLF();
            // Use to of each to ensure we don't accidentally just grab the first one
            xlf.addFile('bundle', {
                '""': '""',
                "''": "''",
                '<<': '<<',
                '>>': '>>',
                '&&': '&&'
            });
            const result = xlf.toString();
            const header = '<?xml version="1.0" encoding="utf-8"?>\r\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">\r\n  <file original="bundle" source-language="en" datatype="plaintext"><body>';
            const amp = '\r\n    <trans-unit id="++CODE++360d9d079c933408511677541ccd65fece76a0c52492ff7b4968b321ec254ecd">\r\n      <source xml:lang="en">&amp;&amp;</source>\r\n    </trans-unit>';
            const apostrophes = '\r\n    <trans-unit id="++CODE++c9e4e11220410db06ceafcd46bac2289fdb40be0a3f35536753e496d56a8e12a">\r\n      <source xml:lang="en">&apos;&apos;</source>\r\n    </trans-unit>';
            const greaterThan = '\r\n    <trans-unit id="++CODE++e3fb2b34d67c2a94b8080121fcd2093339b17c74871275968251fead90e542f7">\r\n      <source xml:lang="en">&gt;&gt;</source>\r\n    </trans-unit>';
            const lessThan = '\r\n    <trans-unit id="++CODE++818e5b6ec86af43da253e44986ed7260db48f2f972a3fafc3575d1a4a088ac3f">\r\n      <source xml:lang="en">&lt;&lt;</source>\r\n    </trans-unit>';
            const quotes = '\r\n    <trans-unit id="++CODE++eac56912e89dd33f3372f8cb3bc427c679f2bfe57eb88c129e1567e32ef6397b">\r\n      <source xml:lang="en">&quot;&quot;</source>\r\n    </trans-unit>';
            const footer = '\r\n  </body></file>\r\n</xliff>';
            assert.strictEqual(result, header + amp + apostrophes + greaterThan + lessThan + quotes + footer);
        });
    });

    context('parse', () => {
        it('parses bundle and package files differently', async () => {
            const result = await XLF.parse(`
    <?xml version="1.0" encoding="utf-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file original="bundle" source-language="en" datatype="plaintext" target-language="de">
    <body>
        <trans-unit id="++CODE++12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126">
            <source xml:lang="en">Hello</source>
            <target state="translated">World</target>
        </trans-unit>
    </body>
    </file>
    <file original="package" source-language="en" datatype="plaintext" target-language="de">
    <body>
        <trans-unit id="id">
            <source xml:lang="en">Hello</source>
            <target state="translated">World</target>
        </trans-unit>
    </body>
    </file>
    </xliff>`);

            assert.ok(result);
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0]!.language, 'de');
            assert.strictEqual(result[0]!.name, 'bundle');
            assert.ok(result[0]!.messages['Hello']);
            assert.strictEqual(result[0]!.messages['Hello'], 'World');

            assert.strictEqual(result[1]!.language, 'de');
            assert.strictEqual(result[1]!.name, 'package');
            assert.ok(result[1]!.messages['id']);
            assert.strictEqual(result[1]!.messages['id'], 'World');
        });

        it('parses double quotes correctly', async () => {
            const result = await XLF.parse(`
    <?xml version="1.0" encoding="utf-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file original="bundle" source-language="en" datatype="plaintext" target-language="de">
    <body>
        <trans-unit id="++CODE++12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126">
            <source xml:lang="en">&quot;&quot;</source>
            <target state="translated">&quot;&quot;</target>
        </trans-unit>
        <trans-unit id="++CODE++6f49cdbd80e1b95d5e6427e1501fc217790daee87055fa5b4e71064288bddede">
            <source xml:lang="en">&apos;&apos;</source>
            <target state="translated">&apos;&apos;</target>
        </trans-unit>
        <trans-unit id="++CODE++4be261c018f23deac37f17f24abb5f42c4f32044fa3116d7b618446fb03ca09e">
            <source xml:lang="en">&lt;&lt;</source>
            <target state="translated">&lt;&lt;</target>
        </trans-unit>
        <trans-unit id="++CODE++0f02c6bad08d9ff1858d26cf1af766e336d71e34c2e74e8c7d417b3550cbfc44">
            <source xml:lang="en">&gt;&gt;</source>
            <target state="translated">&gt;&gt;</target>
        </trans-unit>
        <trans-unit id="++CODE++73e7b6f86214bc78ee505fb5f7d4fb97cfa99924a67ca3105113c9a3d52f8fef">
            <source xml:lang="en">&amp;&amp;</source>
            <target state="translated">&amp;&amp;</target>
        </trans-unit>
    </body>
    </file>
    </xliff>`);
    
            assert.ok(result);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0]!.language, 'de');
            assert.strictEqual(result[0]!.name, 'bundle');
            assert.ok(result[0]!.messages['""']);
            assert.strictEqual(result[0]!.messages['""'], '""');
            assert.ok(result[0]!.messages["''"]);
            assert.strictEqual(result[0]!.messages["''"], "''");
            assert.ok(result[0]!.messages['<<']);
            assert.strictEqual(result[0]!.messages['<<'], '<<');
            assert.ok(result[0]!.messages['>>']);
            assert.strictEqual(result[0]!.messages['>>'], '>>');
            assert.ok(result[0]!.messages['&&']);
            assert.strictEqual(result[0]!.messages['&&'], '&&');
        });

        it ('sorts files by name and then messages by key', async () => {
            // Note that package comes before bundle but 
            const result = await XLF.parse(`
    <?xml version="1.0" encoding="utf-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file original="2" source-language="en" datatype="plaintext" target-language="de">
    <body>
        <trans-unit id="b">
            <source xml:lang="en">b</source>
            <target state="translated">b</target>
        </trans-unit>
        <trans-unit id="a">
            <source xml:lang="en">a</source>
            <target state="translated">a</target>
        </trans-unit>
    </body>
    </file>
    <file original="1" source-language="en" datatype="plaintext" target-language="de">
    <body>
        <trans-unit id="b">
            <source xml:lang="en">b</source>
            <target state="translated">b</target>
        </trans-unit>
        <trans-unit id="a">
            <source xml:lang="en">a</source>
            <target state="translated">a</target>
        </trans-unit>
    </body>
    </file>
    </xliff>`);

            assert.ok(result);
            assert.strictEqual(result.length, 2);

            assert.strictEqual(result[0]!.name, '1');
            assert.ok(result[0]!.messages['a']);
            assert.strictEqual(result[0]!.messages['a'], 'a');
            assert.ok(result[1]!.messages['b']);
            assert.strictEqual(result[1]!.messages['b'], 'b');

            assert.strictEqual(result[1]!.name, '2');
            assert.ok(result[0]!.messages['a']);
            assert.strictEqual(result[0]!.messages['a'], 'a');
            assert.ok(result[1]!.messages['b']);
            assert.strictEqual(result[1]!.messages['b'], 'b');
        });
    });
});
