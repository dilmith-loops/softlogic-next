<?php

namespace App\Support;

class CsvCell
{
    /**
     * Neutralise spreadsheet formula injection by prefixing risky leading characters with a quote.
     */
    public static function sanitize(mixed $value): string
    {
        $value = (string) ($value ?? '');

        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
