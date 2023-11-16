import test from '@lib/BaseTest'
import { TXDecodedLogProps } from '@pages/Common'
import { VerificationFlattenForm } from '@pages/Verification'

test.describe.configure({ mode: `parallel` })

test(`@Verification Can list verified contracts`, async (
    {
        homePage, verificationPage, transactionPage, transactionsListPage,
    },
) => {
    const {
        TestTokenAddressV,
        TestTokenFlatContractCode,
    } = process.env
    await verificationPage.open(TestTokenAddressV)
    const form = {
        contractName: `TestToken`,
        compilerVersion: `v0.8.17+commit.8df45f5f`,
        evmVersion: ``,
        code: TestTokenFlatContractCode,
    } as VerificationFlattenForm
    await verificationPage.fillFlattenForm(form)
    await homePage.check_verified_address_page()
})

test.skip(`@Verification Can verify NFT contract with flatten`, async ({ verificationPage, transactionPage, transactionsListPage }) => {
    // TODO: takes too long and fails sometimes, bug? not enough resources?
    const {
        TestNFTAddressV,
        TestNFTNameV,
        TestNFTSymbolV,
        TestNFTTXMintHashV,
        TestNFTFlatContractCode,
        MinerAddress,
        ZeroAddress,
    } = process.env
    await verificationPage.open(TestNFTAddressV)
    await verificationPage.fillFlattenForm(
        {
            contractName: `TestNFT`,
            compilerVersion: `v0.8.17+commit.8df45f5f`,
            evmVersion: ``,
            code: TestNFTFlatContractCode,
        } as VerificationFlattenForm,
    )
    // await verificationPage.checkCodePage({
    //     contractNameText: `Contract name`,
    //     contractName: `TestNFT`,
    //     compilerVersionText: `Compiler version`,
    //     compilerVersion: `v0.8.17+commit.8df45f5f`,
    //     EVMVersionText: `EVM Version`,
    //     EVMVersion: `default`,
    //     optomizationEnabledText: `Optimization enabled`,
    //     optomizationEnabled: `true`,
    //     optimizationRunsText: `Optimization runs`,
    //     optimizationRuns: `200`,
    //     verifiedAtText: `Verified at`,
    //     verifiedAt: `Z`,
    //     constructorArgsText: `Constructor Arguments`,
    //     codeConstructorArgs: `0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000044e4654560000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e46545600000000000000000000000000000000000000000000000000000000`,
    //     codeTokenName: TestNFTNameV,
    //     codeTokenSymbol: TestNFTSymbolV,
    //     contractSourceCodeText: `Contract source code`,
    //     contractABIText: `Contract ABI`,
    //     deployedByteCodeText: `Deployed ByteCode`,
    // })
    await transactionPage.open(TestNFTTXMintHashV)
    await transactionPage.select_logs_tab()
    await transactionPage.check_decoded_inputs(1, {
        methodIDText: `Method Id`,
        methodID: `0xeacabe14`,
        callText: `Call`,
        call: `mintNFT(address recipient_, string tokenURI_)`,
        logFields: [
            [`recipient_`, `address`, MinerAddress.toLowerCase()],
            [`tokenURI_`, `string`, ``],
        ],
    } as TXDecodedLogProps)
    await transactionPage.check_decoded_tx_logs(1, {
        methodIDText: `Method Id`,
        methodID: `0xddf252ad`,
        callText: `Call`,
        call: `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`,
        logFields: [
            [`from`, `address`, `true`, ZeroAddress],
            [`to`, `address`, `true`, MinerAddress.toLowerCase()],
            [`tokenId`, `uint256`, `true`, `1`],
        ],
    } as TXDecodedLogProps)
    await transactionsListPage.open()
    await transactionsListPage.findText([`MintNFT`])
})
