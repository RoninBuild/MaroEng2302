import { ethers } from 'ethers';
import contractData from './contract.json';

// We do not want to block the user UI, so we run this asynchronously and catch errors silently
export async function recordSessionOnChain(mode: string) {
    if (!contractData.address) {
        console.warn("Chain recording skipped: Missing Contract Address");
        return;
    }

    const win = window as any;
    if (!win.ethereum) {
        console.warn("No Web3 provider found. Are you inside Base App or a Web3 browser?");
        return;
    }

    try {
        const provider = new ethers.BrowserProvider(win.ethereum);
        // Base App (or injected wallet) handles the signer
        const signer = await provider.getSigner();

        const contract = new ethers.Contract(contractData.address, contractData.abi, signer);

        console.log(`[Web3] Requesting user signature to start session (${mode})...`);
        const tx = await contract.startSession(mode);
        console.log(`[Web3] Session started on-chain! TxHash: ${tx.hash}`);

        // We don't wait for confirmation to keep UI fast
    } catch (error) {
        console.error("[Web3] Failed to record session on-chain:", error);
    }
}
